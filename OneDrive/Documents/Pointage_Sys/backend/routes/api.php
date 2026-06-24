<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DailyAttendanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\JustificationController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SyncController;
use Illuminate\Support\Facades\Route;

// --- Authentification (publique) ---
Route::post('/login',  [AuthController::class, 'login']);

// --- SSE temps réel (auth manuelle via ?token=) ---
Route::get('/dashboard/stream', [DashboardController::class, 'stream']);

// --- Endpoint sécurisé pour le script Python (clé secrète) ---
Route::post('/sync/logs',         [SyncController::class, 'receive'])->middleware('sync.secret');
Route::post('/sync/employees',    [SyncController::class, 'syncEmployees'])->middleware('sync.secret');
Route::get('/sync/known-punches', [SyncController::class, 'knownPunches'])->middleware('sync.secret');

// --- Routes protégées par Sanctum (RH uniquement) ---
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    Route::get('/dashboard/today',     [DashboardController::class, 'today']);
    Route::get('/dashboard/live-feed', [DashboardController::class, 'liveFeed']);
    Route::get('/dashboard/week',      [DashboardController::class, 'week']);

    Route::get('/employees/{employee}/profile',   [EmployeeController::class, 'profile']);
    Route::get('/employees/{employee}/calendar',  [EmployeeController::class, 'calendar']);
    Route::post('/employees/{employee}/photo',    [EmployeeController::class, 'uploadPhoto']);
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('schedules', ScheduleController::class);

    Route::get('/attendance',        [DailyAttendanceController::class, 'index']);
    Route::get('/reports/monthly',   [DailyAttendanceController::class, 'monthly']);

    Route::get('/leaves',            [LeaveController::class, 'index']);
    Route::post('/leaves',           [LeaveController::class, 'store']);
    Route::delete('/leaves/{leave}', [LeaveController::class, 'destroy']);

    Route::get('/settings',   [SettingsController::class, 'index']);
    Route::put('/settings',   [SettingsController::class, 'update']);

    Route::get('/justifications',                        [JustificationController::class, 'index']);
    Route::post('/justifications',                       [JustificationController::class, 'store']);
    Route::patch('/justifications/{justification}/review', [JustificationController::class, 'review']);
    Route::delete('/justifications/{justification}',     [JustificationController::class, 'destroy']);
});
