<?php

namespace App\Http\Controllers\Api;

use App\Events\NewPunchReceived;
use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    /**
     * Reçoit un ou plusieurs pointages depuis le script Python.
     * Sécurisé par le middleware CheckSyncSecret.
     *
     * Payload attendu:
     * { "logs": [ { "zkteco_uid": "12", "punched_at": "2026-06-17 08:35:00" }, ... ] }
     */
    public function receive(Request $request)
    {
        $request->validate([
            'logs'              => 'required|array|min:1',
            'logs.*.zkteco_uid' => 'required|string',
            'logs.*.punched_at' => 'required|date',
        ]);

        $inserted = 0;

        DB::transaction(function () use ($request, &$inserted) {
            foreach ($request->logs as $log) {
                $employee = Employee::where('zkteco_uid', $log['zkteco_uid'])->first();

                $record = AttendanceLog::firstOrCreate(
                    [
                        'zkteco_uid' => $log['zkteco_uid'],
                        'punched_at' => $log['punched_at'],
                    ],
                    [
                        'employee_id' => $employee?->id,
                    ]
                );

                if ($record->wasRecentlyCreated) {
                    $inserted++;

                    // Diffuse l'événement en temps réel via WebSocket
                    if ($employee) {
                        broadcast(new NewPunchReceived($employee, $record))->toOthers();
                    }
                }
            }
        });

        return response()->json(['inserted' => $inserted], 201);
    }
}
