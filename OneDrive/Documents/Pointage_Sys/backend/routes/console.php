<?php

use App\Jobs\ProcessDailyAttendance;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recalcule le pointage d'aujourd'hui toutes les 2 minutes (pendant les heures de travail)
Schedule::call(function () {
    ProcessDailyAttendance::dispatchSync(Carbon::today()->toDateString());
})->everyTwoMinutes()
  ->between('07:00', '20:00')
  ->name('process-attendance-live')
  ->withoutOverlapping();

// Recalcul final de la journée à 23:55 (clôture définitive)
Schedule::call(function () {
    ProcessDailyAttendance::dispatchSync(Carbon::today()->toDateString());
})->dailyAt('23:55')
  ->name('process-attendance-nightly');

// Reconstruit tout daily_attendance depuis attendance_logs
Artisan::command('attendance:rebuild', function () {
    $dates = \App\Models\AttendanceLog::selectRaw('DATE(punched_at) as d')->groupBy('d')->pluck('d');
    foreach ($dates as $date) {
        (new \App\Jobs\ProcessDailyAttendance($date))->handle();
        $this->info("Traite: {$date}");
    }
    $total = \App\Models\DailyAttendance::count();
    $this->info("{$total} lignes reconstruites.");
})->purpose('Reconstruit daily_attendance depuis attendance_logs');

// Commande manuelle : php artisan attendance:process {date?}
Artisan::command('attendance:process {date?}', function (string $date = null) {
    $target = $date ?? Carbon::today()->toDateString();
    ProcessDailyAttendance::dispatchSync($target);
    $this->info("Traitement termine pour : {$target}");
})->purpose('Calcule/recalcule le pointage quotidien pour une date donnée');
