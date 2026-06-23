<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->after('position');
            $table->string('cin', 20)->nullable()->after('birth_date');
            $table->string('phone', 30)->nullable()->after('cin');
            $table->string('email', 150)->nullable()->after('phone');
            $table->string('address')->nullable()->after('email');
            $table->date('hire_date')->nullable()->after('address');
            $table->enum('contract_type', ['cdi','cdd','stage','freelance'])->nullable()->after('hire_date');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['birth_date','cin','phone','email','address','hire_date','contract_type']);
        });
    }
};
