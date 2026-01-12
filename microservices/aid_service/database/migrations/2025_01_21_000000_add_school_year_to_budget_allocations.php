<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->string('school_year', 20)->nullable()->after('budget_type');
            $table->boolean('is_active')->default(true)->after('description');
            
            // Remove unique constraint on budget_type and add composite unique
            $table->dropUnique(['budget_type']);
        });

        // Add composite unique constraint for budget_type + school_year
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->unique(['budget_type', 'school_year'], 'budget_type_school_year_unique');
        });

        // Get current school year (format: YYYY-YYYY)
        $currentYear = date('Y');
        $nextYear = date('Y') + 1;
        $currentSchoolYear = "{$currentYear}-{$nextYear}";

        // Update existing records to have current school year
        DB::table('budget_allocations')
            ->whereNull('school_year')
            ->update(['school_year' => $currentSchoolYear]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->dropUnique('budget_type_school_year_unique');
            $table->dropColumn(['school_year', 'is_active']);
            $table->unique('budget_type');
        });
    }
};
