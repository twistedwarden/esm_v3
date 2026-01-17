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
        Schema::create('partner_school_fund_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_school_budget_id')->constrained('partner_school_budgets')->onDelete('cascade');
            $table->unsignedBigInteger('school_id');
            $table->decimal('amount', 15, 2);
            $table->string('purpose');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'disbursed', 'rejected', 'liquidated'])->default('pending');
            $table->string('request_document_path')->nullable(); // Document justifying the request
            $table->string('liquidation_document_path')->nullable(); // Document proving spending
            $table->timestamp('processed_at')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_fund_requests');
    }
};
