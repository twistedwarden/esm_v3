<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('academic_periods', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year'); // e.g., "2025-2026"
            $table->string('period_type'); // "Semester" or "Trimester"
            $table->integer('period_number'); // 1, 2, 3
            $table->date('start_date');
            $table->date('end_date');
            $table->date('application_deadline');
            $table->string('status')->default('open'); // active, closed
            $table->boolean('is_current')->default(false); // Helper to mark the active period
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_periods');
    }
};
