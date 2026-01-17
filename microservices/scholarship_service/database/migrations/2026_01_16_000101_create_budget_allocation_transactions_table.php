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
        Schema::create('budget_allocation_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('partner_school_budgets')->onDelete('cascade');
            $table->enum('transaction_type', [
                'allocation',      // Initial budget allocation
                'adjustment',      // Manual adjustment (increase/decrease)
                'reservation',     // Funds reserved for application
                'disbursement',    // Funds actually disbursed
                'release',         // Reserved funds released (e.g., application rejected)
                'expiry'          // Budget expired
            ]);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('reference_type')->nullable(); // ScholarshipApplication, ManualAdjustment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('performed_by_user_id')->nullable(); // User ID from auth_service
            $table->timestamp('created_at');

            // Indexes for performance
            $table->index(['budget_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
            $table->index('transaction_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_allocation_transactions');
    }
};
