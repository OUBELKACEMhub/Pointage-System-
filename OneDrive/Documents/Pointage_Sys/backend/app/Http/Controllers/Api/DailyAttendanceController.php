<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyAttendance;
use Illuminate\Http\Request;

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

        if ($request->filled('employee')) {
            $search = $request->employee;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        return $query->paginate(50);
    }
}
