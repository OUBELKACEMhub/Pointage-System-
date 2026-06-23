<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_attendance', function (Blueprint $table) {
            $table->unsignedSmallInteger('overtime_minutes')->nullable()->after('worked_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('daily_attendance', function (Blueprint $table) {
            $table->dropColumn('overtime_minutes');
        });
    }
};
