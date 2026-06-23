<?php

namespace App\Jobs;

use App\Models\AttendanceLog;
use App\Models\DailyAttendance;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Schedule;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class ProcessDailyAttendance implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $date // 'Y-m-d'
    ) {}

    public function handle(): void
    {
        $schedule  = Schedule::where('is_active', true)->first();
        $schedMin  = $this->scheduleMinutes($schedule);
        $employees = Employee::where('is_active', true)->get();

        foreach ($employees as $employee) {
            $logs = AttendanceLog::where('employee_id', $employee->id)
                ->whereDate('punched_at', $this->date)
                ->orderBy('punched_at')
                ->pluck('punched_at');

            $hasMission = Leave::where('employee_id', $employee->id)
                ->where('type', 'mission')
                ->where('date_from', '<=', $this->date)
                ->where('date_to',   '>=', $this->date)
                ->exists();

            if ($logs->isEmpty()) {
                // No physical punch — mission counts as a present day worked off-site
                DailyAttendance::updateOrCreate(
                    ['employee_id' => $employee->id, 'work_date' => $this->date],
                    [
                        'check_in'         => null,
                        'check_out'        => null,
                        'worked_minutes'   => $hasMission ? $schedMin : null,
                        'overtime_minutes' => $hasMission ? $schedMin : null,
                        'status'           => $hasMission ? 'present' : 'absent',
                    ]
                );
                continue;
            }

            $checkIn  = Carbon::parse($logs->first());
            $checkOut = Carbon::parse($logs->last());
            $workedMinutes = (int) $checkIn->diffInMinutes($checkOut);

            $status = $this->resolveStatus($checkIn, $schedule);

            // Attendance overtime = time past schedule end
            $attendanceOvertime = $this->calcOvertime($checkOut, $schedule) ?? 0;

            // Mission overtime = full scheduled day (employee also did off-site work)
            $missionOvertime = $hasMission ? $schedMin : 0;

            $totalOvertime = $attendanceOvertime + $missionOvertime;

            DailyAttendance::updateOrCreate(
                ['employee_id' => $employee->id, 'work_date' => $this->date],
                [
                    'check_in'         => $checkIn->format('H:i:s'),
                    'check_out'        => $checkOut->greaterThan($checkIn) ? $checkOut->format('H:i:s') : null,
                    'worked_minutes'   => $workedMinutes > 0 ? $workedMinutes : null,
                    'overtime_minutes' => $totalOvertime > 0 ? $totalOvertime : null,
                    'status'           => $status,
                ]
            );
        }
    }

    // ── helpers ────────────────────────────────────────────────────────

    private function scheduleMinutes(?Schedule $schedule): int
    {
        if (!$schedule) return 480; // default 8 h
        $start = Carbon::createFromFormat('H:i:s', $schedule->start_time);
        $end   = Carbon::createFromFormat('H:i:s', $schedule->end_time);
        return max(0, (int) $start->diffInMinutes($end));
    }

    private function calcOvertime(Carbon $checkOut, ?Schedule $schedule): ?int
    {
        if (!$schedule) return null;

        $expectedEnd = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $checkOut->toDateString() . ' ' . $schedule->end_time
        );

        $overtime = (int) $expectedEnd->diffInMinutes($checkOut, false);
        return $overtime > 0 ? $overtime : null;
    }

    private function resolveStatus(Carbon $checkIn, ?Schedule $schedule): string
    {
        if (!$schedule) return 'present';

        $expectedStart = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $checkIn->toDateString() . ' ' . $schedule->start_time
        );

        return $checkIn->greaterThan($expectedStart->copy()->addMinutes($schedule->tolerance_minutes))
            ? 'late'
            : 'present';
    }
}
