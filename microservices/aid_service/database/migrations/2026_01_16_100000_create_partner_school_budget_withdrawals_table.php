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
        Schema::create('partner_school_budget_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_school_budget_id')
                ->constrained('partner_school_budgets', 'id', 'ps_budget_withdrawals_budget_fk')
                ->onDelete('cascade');
            $table->unsignedBigInteger('school_id');
            $table->decimal('amount', 15, 2);
            $table->string('purpose'); // e.g., "Scholarship for Student X", "Educational Supplies"
            $table->text('notes')->nullable();
            $table->string('proof_document_path'); // Required: proof of where money was used
            $table->timestamp('withdrawal_date'); // Date of withdrawal
            $table->unsignedBigInteger('recorded_by')->nullable(); // User who recorded this
            $table->timestamps();

            // Indexes for faster queries
            $table->index('school_id');
            $table->index('withdrawal_date');
            $table->index('partner_school_budget_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_budget_withdrawals');
    }
};
