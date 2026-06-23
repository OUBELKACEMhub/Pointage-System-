<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\DailyAttendance;
use App\Models\Employee;
use App\Models\Justification;
use App\Models\Leave;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DailyAttendanceController extends Controller
{
    /**
     * Retourne le suivi quotidien avec filtres optionnels.
     * ?date=2026-06-17
     * ?from=2026-06-01&to=2026-06-30
     * ?employee=Ahmed
     */
    public function index(Request $request)
    {
        $query = DailyAttendance::with('employee')
            ->orderByDesc('work_date')
            ->orderBy('employee_id');

        if ($request->filled('date')) {
            $query->whereDate('work_date', $request->date);
        } elseif ($request->filled('from') || $request->filled('to')) {
            $query->when($request->from, fn($q) => $q->whereDate('work_date', '>=', $request->from))
                  ->when($request->to,   fn($q) => $q->whereDate('work_date', '<=', $request->to));
        }

        if ($request->filled('emp_id')) {
            $query->where('employee_id', $request->emp_id);
        } elseif ($request->filled('employee')) {
            $search = $request->employee;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->whereIn('status', explode(',', $request->status));
        }

        $perPage   = min((int) $request->input('per_page', 10), 50);
        $paginated = $query->paginate($perPage);

        // Attacher les scans bruts du jour pour chaque enregistrement
        $employeeIds = $paginated->pluck('employee_id')->filter()->unique()->values();

        // Récupérer tous les scans bruts pour les dates/employés concernés
        $workDates = $paginated->pluck('work_date')
            ->map(fn($d) => is_string($d) ? $d : $d->format('Y-m-d'))
            ->unique()->values();

        $rawLogs = AttendanceLog::whereIn('employee_id', $employeeIds)
            ->whereIn(DB::raw('DATE(punched_at)'), $workDates)
            ->orderBy('punched_at')
            ->get()
            ->groupBy(fn($l) => $l->employee_id . '_' . substr($l->punched_at, 0, 10));

        // Justifications approuvées
        $justifications = Justification::whereIn('employee_id', $employeeIds)
            ->whereIn('work_date', $workDates)
            ->where('status', 'approved')
            ->get()
            ->keyBy(fn($j) => $j->employee_id . '_' . $j->work_date);

        // Congés (hors mission) couvrant les dates concernées
        $minDate = $workDates->min();
        $maxDate = $workDates->max();
        $leaves  = Leave::whereIn('employee_id', $employeeIds)
            ->whereIn('type', ['conge', 'maladie', 'autre'])
            ->where('date_from', '<=', $maxDate)
            ->where('date_to',   '>=', $minDate)
            ->get();

        // Indexer par "employee_id_date" pour toutes les dates couvertes
        $leaveIndex = [];
        foreach ($leaves as $leave) {
            $current = Carbon::parse($leave->date_from);
            $end     = Carbon::parse($leave->date_to);
            while ($current->lte($end)) {
                $d = $current->toDateString();
                if (in_array($d, $workDates->toArray())) {
                    $leaveIndex[$leave->employee_id . '_' . $d] = $leave->type;
                }
                $current->addDay();
            }
        }

        $paginated->getCollection()->transform(function ($record) use ($rawLogs, $justifications, $leaveIndex) {
            $date = is_string($record->work_date)
                ? $record->work_date
                : $record->work_date->format('Y-m-d');
            $key  = $record->employee_id . '_' . $date;
            $record->scans         = ($rawLogs[$key] ?? collect())->pluck('punched_at')->values();
            $record->justification = $justifications[$key] ?? null;
            $record->on_leave      = $leaveIndex[$key] ?? null;
            return $record;
        });

        return $paginated;
    }

    /**
     * Agrégation mensuelle par employé.
     * ?month=2026-06
     */
    public function monthly(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));

        [$year, $mon] = explode('-', $month);
        $from = "{$year}-{$mon}-01";
        $to   = date('Y-m-t', strtotime($from));

        // Schedule hours (for mission overtime calculation)
        $schedule    = Schedule::where('is_active', true)->first();
        $schedMin    = $this->scheduleMinutes($schedule);

        // Base aggregation from daily_attendance
        $rows = DailyAttendance::with('employee')
            ->whereBetween('work_date', [$from, $to])
            ->get()
            ->groupBy('employee_id')
            ->map(function ($records) {
                $emp = $records->first()->employee;
                return [
                    'employee_id'      => $emp->id,
                    'name'             => $emp->first_name . ' ' . $emp->last_name,
                    'department'       => $emp->department,
                    'present'          => $records->where('status', 'present')->count(),
                    'late'             => $records->where('status', 'late')->count(),
                    'absent'           => $records->where('status', 'absent')->count(),
                    'total_minutes'    => $records->sum('worked_minutes'),
                    // Heures sup = total worked minutes (présence physique)
                    'overtime_minutes' => $records->whereNotNull('check_in')->sum('worked_minutes'),
                ];
            });

        // Add mission overtime: query all mission leaves overlapping the period
        $missions = Leave::where('type', 'mission')
            ->where('date_from', '<=', $to)
            ->where('date_to',   '>=', $from)
            ->get();

        foreach ($missions as $leave) {
            $empId       = $leave->employee_id;
            $overlapFrom = Carbon::parse(max($from, $leave->date_from->format('Y-m-d')));
            $overlapTo   = Carbon::parse(min($to,   $leave->date_to->format('Y-m-d')));
            $missionDays = $overlapFrom->diffInDays($overlapTo) + 1;

            if ($rows->has($empId)) {
                $rows[$empId]['overtime_minutes'] += $missionDays * $schedMin;
            }
        }

        return response()->json([
            'month' => $month,
            'from'  => $from,
            'to'    => $to,
            'data'  => $rows->values(),
        ]);
    }

    private function scheduleMinutes(?Schedule $schedule): int
    {
        if (!$schedule) return 480;
        $start = Carbon::createFromFormat('H:i:s', $schedule->start_time);
        $end   = Carbon::createFromFormat('H:i:s', $schedule->end_time);
        return max(0, (int) $start->diffInMinutes($end));
    }
}
