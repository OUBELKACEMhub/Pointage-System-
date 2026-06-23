<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'first_name', 'last_name', 'department', 'position', 'zkteco_uid', 'is_active', 'photo_path',
        'birth_date', 'cin', 'phone', 'email', 'address', 'hire_date', 'contract_type',
    ];

    protected $appends = ['photo_url', 'age'];

    protected $casts = [
        'is_active'  => 'boolean',
        'birth_date' => 'date',
        'hire_date'  => 'date',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? asset('storage/' . $this->photo_path) : null;
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date ? $this->birth_date->age : null;
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function dailyAttendances()
    {
        return $this->hasMany(DailyAttendance::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
