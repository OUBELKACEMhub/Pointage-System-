<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $fillable = ['zkteco_uid', 'employee_id', 'punched_at'];

    // Pas de cast datetime → retourné comme chaîne brute "2026-05-18 11:23:24"
    // (évite que Laravel ajoute le Z UTC qui décale l'heure côté frontend)
    protected $casts = [];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
