<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix decimal columns that are causing multiplication issues
        // Change decimal(10,2) to decimal(12,2) to handle larger values properly
        
        // Fix family_members monthly_income column
        Schema::table('family_members', function (Blueprint $table) {
            $table->decimal('monthly_income', 12, 2)->nullable()->change();
        });
        
        // Fix financial_information columns
        Schema::table('financial_information', function (Blueprint $table) {
            $table->decimal('monthly_income', 12, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original decimal sizes
        Schema::table('family_members', function (Blueprint $table) {
            $table->decimal('monthly_income', 10, 2)->nullable()->change();
        });
        
        Schema::table('financial_information', function (Blueprint $table) {
            $table->decimal('monthly_income', 10, 2)->nullable()->change();
        });
    }
};
