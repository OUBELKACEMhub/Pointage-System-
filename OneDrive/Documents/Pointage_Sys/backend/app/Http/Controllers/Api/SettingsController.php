<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json(DB::table('app_settings')->pluck('value', 'key'));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'absence_threshold' => 'required|integer|min:1|max:31',
        ]);

        foreach ($data as $key => $value) {
            DB::table('app_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => (string) $value, 'updated_at' => now()]
            );
        }

        return response()->json(DB::table('app_settings')->pluck('value', 'key'));
    }
}
