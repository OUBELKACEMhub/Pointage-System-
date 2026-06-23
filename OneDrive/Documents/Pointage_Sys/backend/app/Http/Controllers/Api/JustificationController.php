<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Justification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JustificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Justification::with('employee')
            ->orderByDesc('work_date')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee')) {
            $search = $request->employee;
            $query->whereHas('employee', fn($q) =>
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
            );
        }

        if ($request->filled('month')) {
            [$y, $m] = explode('-', $request->month);
            $query->whereYear('work_date', $y)->whereMonth('work_date', $m);
        }

        return $query->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'work_date'   => 'required|date',
            'reason'      => 'required|string|max:1000',
            'status'      => 'nullable|in:pending,approved,rejected',
            'file'        => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('justifications', 'public');
        }

        $justification = Justification::create([
            'employee_id' => $data['employee_id'],
            'work_date'   => $data['work_date'],
            'reason'      => $data['reason'],
            'file_path'   => $filePath,
            'status'      => $data['status'] ?? 'pending',
        ]);

        return response()->json($justification->load('employee'), 201);
    }

    public function review(Request $request, Justification $justification)
    {
        $data = $request->validate([
            'status'  => 'required|in:approved,rejected',
            'rh_note' => 'nullable|string|max:500',
        ]);

        $justification->update($data);

        return response()->json($justification->load('employee'));
    }

    public function destroy(Justification $justification)
    {
        if ($justification->file_path) {
            Storage::disk('public')->delete($justification->file_path);
        }
        $justification->delete();
        return response()->noContent();
    }
}
