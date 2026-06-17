<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyAttendance extends Model
{
    protected $table = 'daily_attendance';

    protected $fillable = [
        'employee_id', 'work_date', 'check_in', 'check_out', 'worked_minutes', 'status',
    ];

    protected $casts = [
        'work_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getWorkedHoursAttribute(): ?string
    {
        if ($this->worked_minutes === null) {
            return null;
        }
        $h = intdiv($this->worked_minutes, 60);
        $m = $this->worked_minutes % 60;
        return sprintf('%02d:%02d', $h, $m);
    }
}
