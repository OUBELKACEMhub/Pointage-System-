<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            // Supprimer d'abord la FK, ensuite l'index unique, puis la colonne
            $table->dropForeign(['employee_id']);
            $table->dropUnique(['employee_id', 'leave_date']);
            $table->dropColumn('leave_date');

            // Ajouter la plage de dates (nullable car la table peut avoir des lignes existantes)
            $table->date('date_from')->nullable()->after('employee_id');
            $table->date('date_to')->nullable()->after('date_from');

            // Remettre la FK
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn(['date_from', 'date_to']);
            $table->date('leave_date')->after('employee_id');
            $table->unique(['employee_id', 'leave_date']);
        });
    }
};
