<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        return Employee::orderBy('last_name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'department'  => 'nullable|string|max:100',
            'position'    => 'nullable|string|max:100',
            'zkteco_uid'  => 'required|string|max:50|unique:employees,zkteco_uid',
            'is_active'   => 'boolean',
        ]);

        return response()->json(Employee::create($data), 201);
    }

    public function show(Employee $employee)
    {
        return $employee;
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'first_name'  => 'sometimes|string|max:100',
            'last_name'   => 'sometimes|string|max:100',
            'department'  => 'nullable|string|max:100',
            'position'    => 'nullable|string|max:100',
            'zkteco_uid'  => 'sometimes|string|max:50|unique:employees,zkteco_uid,' . $employee->id,
            'is_active'   => 'boolean',
        ]);

        $employee->update($data);
        return $employee;
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->noContent();
    }
}
