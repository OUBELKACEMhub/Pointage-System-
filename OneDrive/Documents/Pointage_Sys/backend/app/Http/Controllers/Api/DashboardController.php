<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\DailyAttendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
}
