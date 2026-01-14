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
        // Drop the composite unique constraint first (if it exists)
        try {
            DB::statement('ALTER TABLE budget_allocations DROP INDEX budget_type_school_year_unique');
        } catch (\Exception $e) {
            // Constraint might not exist, continue
        }

        // Change budget_type from enum to string to allow custom budget types
        Schema::table('budget_allocations', function (Blueprint $table) {
            // Drop the enum column
            $table->dropColumn('budget_type');
        });

        // Add it back as a string
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->string('budget_type', 100)->after('id');
        });

        // Re-add the composite unique constraint
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->unique(['budget_type', 'school_year'], 'budget_type_school_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the composite unique constraint first
        try {
            DB::statement('ALTER TABLE budget_allocations DROP INDEX budget_type_school_year_unique');
        } catch (\Exception $e) {
            // Constraint might not exist, continue
        }

        Schema::table('budget_allocations', function (Blueprint $table) {
            // Drop the string column
            $table->dropColumn('budget_type');
        });

        // Add it back as enum with original values
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->enum('budget_type', ['financial_support', 'scholarship_benefits'])->after('id');
        });

        // Re-add composite unique constraint
        Schema::table('budget_allocations', function (Blueprint $table) {
            $table->unique(['budget_type', 'school_year'], 'budget_type_school_year_unique');
        });
    }
};
