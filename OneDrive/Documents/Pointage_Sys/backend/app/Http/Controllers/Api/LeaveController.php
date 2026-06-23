<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = Leave::with('employee')->orderByDesc('date_from');

        if ($request->filled('month')) {
            [$y, $m] = explode('-', $request->month);
            $from = "{$y}-{$m}-01";
            $to   = date('Y-m-t', strtotime($from));
            // Récupère les congés qui chevauchent le mois
            $query->where('date_from', '<=', $to)->where('date_to', '>=', $from);
        }
        if ($request->filled('employee')) {
            $search = $request->employee;
            $query->whereHas('employee', fn($q) => $q
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
            );
        }

        return $query->paginate(min((int) $request->input('per_page', 15), 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date_from'   => 'required|date',
            'date_to'     => 'required|date|after_or_equal:date_from',
            'type'        => 'required|in:conge,maladie,mission,autre',
            'note'        => 'nullable|string|max:255',
        ]);

        $leave = Leave::create($data);

        return response()->json($leave->load('employee'), 201);
    }

    public function destroy(Leave $leave)
    {
        $leave->delete();
        return response()->json(['deleted' => true]);
    }
}
