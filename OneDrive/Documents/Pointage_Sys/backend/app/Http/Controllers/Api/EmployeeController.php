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
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::orderBy('last_name')->get();

        $now      = Carbon::now();
        $from     = $now->copy()->startOfMonth()->toDateString();
        $to       = $now->copy()->endOfMonth()->toDateString();
        $schedule = Schedule::where('is_active', true)->first();
        $schedMin = $this->scheduleMinutes($schedule);

        // Total worked minutes + counts (physical punches only)
        $attStats = DailyAttendance::whereBetween('work_date', [$from, $to])
            ->whereNotNull('check_in')
            ->selectRaw('
                employee_id,
                SUM(COALESCE(worked_minutes, 0))                           AS worked_total,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END)        AS present,
                SUM(CASE WHEN status = "late"    THEN 1 ELSE 0 END)        AS late,
                SUM(CASE WHEN status = "absent"  THEN 1 ELSE 0 END)        AS absent
            ')
            ->groupBy('employee_id')
            ->get()
            ->keyBy('employee_id');

        // Mission minutes this month
        $missions = Leave::where('type', 'mission')
            ->where('date_from', '<=', $to)
            ->where('date_to',   '>=', $from)
            ->get();

        $missionMin = [];
        foreach ($missions as $leave) {
            $oFrom = Carbon::parse(max($from, $leave->date_from->format('Y-m-d')));
            $oTo   = Carbon::parse(min($to,   $leave->date_to->format('Y-m-d')));
            $days  = $oFrom->diffInDays($oTo) + 1;
            $missionMin[$leave->employee_id] = ($missionMin[$leave->employee_id] ?? 0) + $days * $schedMin;
        }

        return $employees->map(function ($emp) use ($attStats, $missionMin) {
            $s = $attStats->get($emp->id);
            // Heures sup = temps total travaillé + temps de mission
            $emp->month_overtime = (int)($s->worked_total ?? 0) + ($missionMin[$emp->id] ?? 0);
            $emp->month_present  = (int)($s->present ?? 0);
            $emp->month_late     = (int)($s->late    ?? 0);
            $emp->month_absent   = (int)($s->absent  ?? 0);
            return $emp;
        });
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'department'    => 'nullable|string|max:100',
            'position'      => 'nullable|string|max:100',
            'zkteco_uid'    => 'required|string|max:50|unique:employees,zkteco_uid',
            'is_active'     => 'boolean',
            'birth_date'    => 'nullable|date',
            'cin'           => 'nullable|string|max:20',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:150',
            'address'       => 'nullable|string|max:255',
            'hire_date'     => 'nullable|date',
            'contract_type' => 'nullable|in:cdi,cdd,stage,freelance',
        ]);

        return response()->json(Employee::create($data), 201);
    }

    public function show(Employee $employee)
    {
        return $employee;
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'department'    => 'nullable|string|max:100',
            'position'      => 'nullable|string|max:100',
            'zkteco_uid'    => 'sometimes|string|max:50|unique:employees,zkteco_uid,' . $employee->id,
            'is_active'     => 'boolean',
            'birth_date'    => 'nullable|date',
            'cin'           => 'nullable|string|max:20',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:150',
            'address'       => 'nullable|string|max:255',
            'hire_date'     => 'nullable|date',
            'contract_type' => 'nullable|in:cdi,cdd,stage,freelance',
        ]);

        $employee->update($data);
        return $employee;
    }

    public function profile(Employee $employee)
    {
        $now  = Carbon::now();
        $from = $now->copy()->startOfMonth()->toDateString();
        $to   = $now->copy()->endOfMonth()->toDateString();

        $records = DailyAttendance::where('employee_id', $employee->id)
            ->whereBetween('work_date', [$from, $to])
            ->orderByDesc('work_date')
            ->get();

        $present  = $records->where('status', 'present')->count();
        $late     = $records->where('status', 'late')->count();
        $absent   = $records->where('status', 'absent')->count();
        $pointed  = $present + $late;
        $punctuality = $pointed > 0 ? round($present / $pointed * 100) : null;

        $avgArrival = DailyAttendance::where('employee_id', $employee->id)
            ->whereBetween('work_date', [$from, $to])
            ->whereNotNull('check_in')
            ->whereIn('status', ['present', 'late'])
            ->selectRaw('SEC_TO_TIME(AVG(TIME_TO_SEC(check_in))) as avg_in')
            ->value('avg_in');

        // Total worked minutes (présence physique) = base des heures sup
        $attendanceOvertime = $records->whereNotNull('check_in')->sum('worked_minutes');

        // Mission overtime this month
        $schedule  = Schedule::where('is_active', true)->first();
        $schedMin  = $this->scheduleMinutes($schedule);

        $missions = Leave::where('employee_id', $employee->id)
            ->where('type', 'mission')
            ->where('date_from', '<=', $to)
            ->where('date_to',   '>=', $from)
            ->get();

        $missionOvertimeMinutes = 0;
        foreach ($missions as $leave) {
            $overlapFrom = Carbon::parse(max($from, $leave->date_from->format('Y-m-d')));
            $overlapTo   = Carbon::parse(min($to,   $leave->date_to->format('Y-m-d')));
            $missionOvertimeMinutes += ($overlapFrom->diffInDays($overlapTo) + 1) * $schedMin;
        }

        $totalOvertimeMinutes = $attendanceOvertime + $missionOvertimeMinutes;

        // 30-day history
        $historyFrom = Carbon::now()->subDays(29)->toDateString();
        $historyRecords = DailyAttendance::where('employee_id', $employee->id)
            ->where('work_date', '>=', $historyFrom)
            ->orderByDesc('work_date')
            ->get();

        // Justifications approuvées sur la même période
        $justifications = Justification::where('employee_id', $employee->id)
            ->where('work_date', '>=', $historyFrom)
            ->where('status', 'approved')
            ->get()
            ->keyBy(fn($j) => (string) $j->work_date);

        // Congés (hors mission) couvrant la même période
        $leavesRaw = Leave::where('employee_id', $employee->id)
            ->whereIn('type', ['conge', 'maladie', 'autre'])
            ->where('date_from', '<=', Carbon::now()->toDateString())
            ->where('date_to',   '>=', $historyFrom)
            ->get();

        $leaveIndex = [];
        foreach ($leavesRaw as $leave) {
            $cur = Carbon::parse($leave->date_from);
            $end = Carbon::parse($leave->date_to);
            while ($cur->lte($end)) {
                $leaveIndex[$cur->toDateString()] = $leave->type;
                $cur->addDay();
            }
        }

        $history = $historyRecords->map(function ($r) use ($justifications, $leaveIndex) {
            $date = is_string($r->work_date) ? $r->work_date : $r->work_date->format('Y-m-d');
            return [
                'work_date'        => $date,
                'status'           => $r->status,
                'check_in'         => $r->check_in,
                'check_out'        => $r->check_out,
                'worked_hours'     => $r->worked_hours,
                'overtime_minutes' => $r->overtime_minutes,
                'justification'    => isset($justifications[$date])
                    ? ['reason' => $justifications[$date]->reason]
                    : null,
                'on_leave'         => $leaveIndex[$date] ?? null,
            ];
        });

        return response()->json([
            'employee'                => $employee,
            'month'                   => $now->format('Y-m'),
            'stats'                   => compact('present', 'late', 'absent', 'punctuality'),
            'avg_arrival'             => $avgArrival ? substr($avgArrival, 0, 5) : null,
            'overtime_minutes'        => $totalOvertimeMinutes,
            'mission_overtime_minutes'=> $missionOvertimeMinutes,
            'history'                 => $history,
        ]);
    }

    private function scheduleMinutes(?Schedule $schedule): int
    {
        if (!$schedule) return 480;
        $start = Carbon::createFromFormat('H:i:s', $schedule->start_time);
        $end   = Carbon::createFromFormat('H:i:s', $schedule->end_time);
        return max(0, (int) $start->diffInMinutes($end));
    }

    public function calendar(Employee $employee, Request $request)
    {
        $month = $request->input('month', Carbon::now()->format('Y-m'));
        [$y, $m] = explode('-', $month);
        $from = "{$y}-{$m}-01";
        $to   = date('Y-m-t', strtotime($from));

        $records = DailyAttendance::where('employee_id', $employee->id)
            ->whereBetween('work_date', [$from, $to])
            ->get()
            ->keyBy('work_date');

        // Congés (hors mission) couvrant ce mois
        $leavesRaw = Leave::where('employee_id', $employee->id)
            ->whereIn('type', ['conge', 'maladie', 'autre'])
            ->where('date_from', '<=', $to)
            ->where('date_to',   '>=', $from)
            ->get();

        $leaveIndex = [];
        foreach ($leavesRaw as $leave) {
            $cur = Carbon::parse($leave->date_from);
            $end = Carbon::parse($leave->date_to);
            while ($cur->lte($end)) {
                $d = $cur->toDateString();
                if ($d >= $from && $d <= $to) $leaveIndex[$d] = $leave->type;
                $cur->addDay();
            }
        }

        // Merge: construire un record pour chaque jour du mois
        $allDays = [];
        $cur = Carbon::parse($from);
        $end = Carbon::parse($to);
        while ($cur->lte($end)) {
            $d = $cur->toDateString();
            $rec = $records->get($d);
            $allDays[$d] = [
                'status'   => $rec?->status ?? null,
                'check_in' => $rec?->check_in ?? null,
                'check_out'=> $rec?->check_out ?? null,
                'on_leave' => $leaveIndex[$d] ?? null,
            ];
            $cur->addDay();
        }

        return response()->json([
            'month'   => $month,
            'from'    => $from,
            'to'      => $to,
            'records' => $allDays,
        ]);
    }

    public function uploadPhoto(Request $request, Employee $employee)
    {
        $request->validate(['photo' => 'required|image|max:3072']);

        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $path = $request->file('photo')->store('photos', 'public');
        $employee->update(['photo_path' => $path]);

        return response()->json(['photo_url' => $employee->photo_url]);
    }

    public function destroy(Employee $employee)
    {
        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }
        $employee->delete();
        return response()->noContent();
    }
}
