<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'total'   => $totalEmployees,
            'present' => (int) ($stats->present ?? 0),
            'late'    => (int) ($stats->late ?? 0),
            'absent'  => (int) ($stats->absent ?? ($totalEmployees - ($stats->present ?? 0) - ($stats->late ?? 0))),
            'date'    => $today,
        ]);
    }
}
