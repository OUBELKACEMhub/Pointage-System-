<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    protected $fillable = ['employee_id', 'date_from', 'date_to', 'type', 'note'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
