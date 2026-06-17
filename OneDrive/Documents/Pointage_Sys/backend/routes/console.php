<?php

use App\Jobs\ProcessDailyAttendance;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Calcule le pointage de la journée précédente chaque soir à 23:55
Schedule::call(function () {
    ProcessDailyAttendance::dispatch(Carbon::today()->toDateString());
})->dailyAt('23:55')->name('process-daily-attendance');

// Permet aussi de recalculer manuellement via artisan attendance:process {date?}
Artisan::command('attendance:process {date?}', function (string $date = null) {
    $target = $date ?? Carbon::today()->toDateString();
    ProcessDailyAttendance::dispatch($target);
    $this->info("Job dispatché pour : {$target}");
})->purpose('Calcule/recalcule le pointage quotidien pour une date donnée');
