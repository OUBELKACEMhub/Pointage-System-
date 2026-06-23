<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('leave_date');
            // conge | maladie | mission | autre
            $table->enum('type', ['conge', 'maladie', 'mission', 'autre'])->default('conge');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'leave_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
