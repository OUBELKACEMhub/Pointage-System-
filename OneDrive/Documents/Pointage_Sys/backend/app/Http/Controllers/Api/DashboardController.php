<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\DailyAttendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\PersonalAccessToken;

class DashboardController extends Controller
{
    public function today()
    {
        $today = Carbon::today()->toDateString();
        $totalEmployees = Employee::where('is_active', true)->count();

        $stats = DailyAttendance::whereDate('work_date', $today)
            ->selectRaw("
                SUM(status = 'present') as present,
                SUM(status = 'late')    as late,
                SUM(status = 'absent')  as absent
            ")
            ->first();

        $present = (int) ($stats->present ?? 0);
        $late    = (int) ($stats->late    ?? 0);
        $absent  = (int) ($stats->absent  ?? 0);

        // Si aucun calcul daily n'a encore eu lieu aujourd'hui, marquer tous comme absents
        if ($present + $late + $absent === 0) {
            $absent = $totalEmployees;
        }

        return response()->json([
            'total'   => $totalEmployees,
            'present' => $present,
            'late'    => $late,
            'absent'  => $absent,
            'date'    => $today,
        ]);
    }

    public function liveFeed()
    {
        $logs = AttendanceLog::with('employee')
            ->whereNotNull('employee_id')
            ->orderByDesc('punched_at')
            ->limit(20)
            ->get()
            ->map(fn($log) => [
                'id'         => $log->id,
                'full_name'  => $log->employee->first_name . ' ' . $log->employee->last_name,
                'department' => $log->employee->department,
                'punched_at' => $log->punched_at,
            ]);

        return response()->json($logs);
    }

    /**
     * SSE — pousse chaque nouveau pointage dès qu'il arrive.
     * Auth : token Sanctum passé en query param ?token=xxx
     * (EventSource ne supporte pas les headers HTTP custom)
     */
    public function stream(Request $request)
    {
        // Vérification manuelle du token Sanctum
        $tokenValue = $request->query('token');
        if (!$tokenValue) {
            abort(401);
        }
        [$id, $plain] = explode('|', $tokenValue, 2) + [null, null];
        $pat = PersonalAccessToken::find($id);
        if (!$pat || !hash_equals($pat->token, hash('sha256', $plain))) {
            abort(401);
        }

        // Dernier ID connu au moment de la connexion
        $lastId = (int) ($request->query('last_id') ?? AttendanceLog::max('id') ?? 0);

        return response()->stream(function () use ($lastId) {
            // Désactiver tous les buffers PHP
            while (ob_get_level()) ob_end_clean();
            set_time_limit(0);

            $idle = 0;

            while (true) {
                if (connection_aborted()) break;

                $newLogs = AttendanceLog::with('employee')
                    ->whereNotNull('employee_id')
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->get();

                foreach ($newLogs as $log) {
                    $data = json_encode([
                        'id'         => $log->id,
                        'full_name'  => $log->employee->first_name . ' ' . $log->employee->last_name,
                        'department' => $log->employee->department,
                        'punched_at' => $log->punched_at,
                    ]);
                    echo "id: {$log->id}\n";
                    echo "event: punch\n";
                    echo "data: {$data}\n\n";
                    $lastId = $log->id;
                    $idle = 0;
                }

                // Heartbeat toutes les 15s pour garder la connexion ouverte
                if ($idle % 30 === 0) {
                    echo ": heartbeat\n\n";
                }

                flush();
                sleep(1);
                $idle += 1;
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache, no-store',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }
}
