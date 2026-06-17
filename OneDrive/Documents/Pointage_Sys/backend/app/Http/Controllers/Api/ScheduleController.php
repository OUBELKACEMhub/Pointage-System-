<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index()
    {
        return Schedule::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'nullable|string|max:100',
            'start_time'         => 'required|date_format:H:i',
            'end_time'           => 'required|date_format:H:i|after:start_time',
            'tolerance_minutes'  => 'integer|min:0|max:60',
            'is_active'          => 'boolean',
        ]);

        return response()->json(Schedule::create($data), 201);
    }

    public function show(Schedule $schedule)
    {
        return $schedule;
    }

    public function update(Request $request, Schedule $schedule)
    {
        $data = $request->validate([
            'name'               => 'nullable|string|max:100',
            'start_time'         => 'sometimes|date_format:H:i',
            'end_time'           => 'sometimes|date_format:H:i',
            'tolerance_minutes'  => 'integer|min:0|max:60',
            'is_active'          => 'boolean',
        ]);

        $schedule->update($data);
        return $schedule;
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->noContent();
    }
}
