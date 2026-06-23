<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Justification extends Model
{
    protected $fillable = ['employee_id', 'work_date', 'reason', 'file_path', 'status', 'rh_note'];

    protected $appends = ['file_url'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }
}
