<?php

namespace App\Http\Controllers\Api;

use App\Events\NewPunchReceived;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessDailyAttendance;
use App\Models\AttendanceLog;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

        // Toujours recalculer aujourd'hui (même si aucun nouveau log)
        // + les autres dates si des nouveaux logs ont été insérés
        $datesToProcess = collect([Carbon::today()->toDateString()]);

        if ($inserted > 0) {
            $datesToProcess = $datesToProcess->merge(
                collect($request->logs)
                    ->pluck('punched_at')
                    ->map(fn($dt) => Carbon::parse($dt)->toDateString())
            )->unique();
        }

        foreach ($datesToProcess as $date) {
            ProcessDailyAttendance::dispatchSync($date);
        }

        return response()->json(['inserted' => $inserted], 201);
    }

    /**
     * Retourne tous les punched_at déjà enregistrés aujourd'hui.
     * Utilisé par sync.py au démarrage pour éviter les doublons.
     */
    public function knownPunches()
    {
        $today = Carbon::today()->toDateString();
        $punches = AttendanceLog::whereDate('punched_at', $today)
            ->pluck('punched_at')
            ->map(fn($dt) => Carbon::parse($dt)->format('Y-m-d H:i:s'))
            ->toArray();

        return response()->json(['punches' => $punches]);
    }

    /**
     * Reçoit la liste des utilisateurs de la machine ZKTeco
     * et crée automatiquement les employés manquants.
     *
     * Payload: { "users": [ { "uid": "3", "name": "Karim Alami" }, ... ] }
     */
    public function syncEmployees(Request $request)
    {
        $request->validate([
            'users'        => 'required|array',
            'users.*.uid'  => 'required|string',
            'users.*.name' => 'nullable|string',
        ]);

        $created = 0;

        foreach ($request->users as $user) {
            $uid  = (string) $user['uid'];
            $name = trim($user['name'] ?? '');

            $parts     = explode(' ', $name, 2);
            $firstName = $parts[0] ?: "Employe {$uid}";
            $lastName  = $parts[1] ?? '.';

            $result = Employee::firstOrCreate(
                ['zkteco_uid' => $uid],
                [
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'is_active'  => true,
                ]
            );

            if ($result->wasRecentlyCreated) {
                $created++;
            }
        }

        return response()->json(['created' => $created], 201);
    }
}
