<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyAttendance extends Model
{
    protected $table = 'daily_attendance';

    protected $fillable = [
        'employee_id', 'work_date', 'check_in', 'check_out', 'worked_minutes', 'overtime_minutes', 'status',
    ];

    protected $appends = ['worked_hours', 'overtime_hours'];

    // Pas de cast sur work_date → retourné comme chaîne "2026-05-18"
    protected $casts = [];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getWorkedHoursAttribute(): ?string
    {
        if ($this->worked_minutes === null) return null;
        return sprintf('%02d:%02d', intdiv($this->worked_minutes, 60), $this->worked_minutes % 60);
    }

    public function getOvertimeHoursAttribute(): ?string
    {
        if ($this->overtime_minutes === null) return null;
        return sprintf('%02d:%02d', intdiv($this->overtime_minutes, 60), $this->overtime_minutes % 60);
    }
}
