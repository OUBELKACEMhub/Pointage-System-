<?php

namespace App\Jobs;

use App\Models\AttendanceLog;
use App\Models\DailyAttendance;
use App\Models\Employee;
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

    /**
     * Phase 3 : Algorithme de calcul entrée/sortie pour une journée donnée.
     *
     * Pour chaque employé actif :
     *   - Cherche tous ses pointages bruts du jour (attendance_logs)
     *   - Premier pointage → heure d'entrée
     *   - Dernier pointage → heure de sortie
     *   - Calcule worked_minutes et détermine le statut via l'horaire actif
     */
    public function handle(): void
    {
        $schedule = Schedule::where('is_active', true)->first();
        $employees = Employee::where('is_active', true)->get();

        foreach ($employees as $employee) {
            $logs = AttendanceLog::where('employee_id', $employee->id)
                ->whereDate('punched_at', $this->date)
                ->orderBy('punched_at')
                ->pluck('punched_at');

            if ($logs->isEmpty()) {
                DailyAttendance::updateOrCreate(
                    ['employee_id' => $employee->id, 'work_date' => $this->date],
                    ['check_in' => null, 'check_out' => null, 'worked_minutes' => null, 'status' => 'absent']
                );
                continue;
            }

            $checkIn  = Carbon::parse($logs->first());
            $checkOut = Carbon::parse($logs->last());
            $workedMinutes = (int) $checkIn->diffInMinutes($checkOut);

            $status = $this->resolveStatus($checkIn, $schedule);

            DailyAttendance::updateOrCreate(
                ['employee_id' => $employee->id, 'work_date' => $this->date],
                [
                    'check_in'       => $checkIn->format('H:i:s'),
                    'check_out'      => $checkOut->greaterThan($checkIn) ? $checkOut->format('H:i:s') : null,
                    'worked_minutes' => $workedMinutes > 0 ? $workedMinutes : null,
                    'status'         => $status,
                ]
            );
        }
    }

    private function resolveStatus(Carbon $checkIn, ?Schedule $schedule): string
    {
        if (!$schedule) {
            return 'present';
        }

        $expectedStart = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $checkIn->toDateString() . ' ' . $schedule->start_time
        );

        $lateThreshold = $expectedStart->copy()->addMinutes($schedule->tolerance_minutes);

        return $checkIn->greaterThan($lateThreshold) ? 'late' : 'present';
    }
}
