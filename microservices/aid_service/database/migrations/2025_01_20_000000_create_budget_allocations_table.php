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
        Schema::create('budget_allocations', function (Blueprint $table) {
            $table->id();
            $table->enum('budget_type', ['financial_support', 'scholarship_benefits'])->unique();
            $table->decimal('total_budget', 15, 2)->default(0);
            $table->decimal('allocated_budget', 15, 2)->default(0); // Budget allocated to approved applications
            $table->decimal('disbursed_budget', 15, 2)->default(0); // Budget already disbursed
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        // Note: financial_support is kept in enum for future use, but only scholarship_benefits is used currently

        // Insert initial budget allocations (temporary data for testing)
        DB::table('budget_allocations')->insert([
            [
                'budget_type' => 'scholarship_benefits',
                'total_budget' => 1000000.00, // Temporary: ₱1,000,000 for testing
                'allocated_budget' => 0,
                'disbursed_budget' => 0,
                'description' => 'Temporary budget for merit, special, and renewal scholarship programs',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_allocations');
    }
};
