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
        Schema::create('fund_disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->foreignId('budget_id')->nullable()->constrained('partner_school_budgets')->onDelete('set null');
            $table->decimal('amount', 15, 2);
            $table->enum('disbursement_method', ['bank_transfer', 'gcash', 'maya', 'check', 'cash']);
            $table->string('reference_number')->nullable();
            $table->date('disbursement_date');
            $table->boolean('processed_by_school')->default(false); // true if partner school initiated
            $table->unsignedBigInteger('processed_by_user_id')->nullable(); // User ID from auth_service
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['application_id', 'status']);
            $table->index(['budget_id', 'disbursement_date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_disbursements');
    }
};
