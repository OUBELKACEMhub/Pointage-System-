<?php

use App\Http\Controllers\Api\DailyAttendanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SyncController;
use Illuminate\Support\Facades\Route;

// --- Endpoint sécurisé pour le script Python ---
Route::post('/sync/logs', [SyncController::class, 'receive'])
    ->middleware('sync.secret');

// --- API interne du Dashboard (pas d'auth pour l'instant) ---
Route::get('/dashboard/today',     [DashboardController::class, 'today']);
Route::get('/dashboard/live-feed', [DashboardController::class, 'liveFeed']);

Route::apiResource('employees', EmployeeController::class);
Route::apiResource('schedules', ScheduleController::class);

Route::get('/attendance', [DailyAttendanceController::class, 'index']);
