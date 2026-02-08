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
        Schema::create('fund_requests', function (Blueprint $table) {
            $table->id();
            $table->string('school_year'); // e.g., "2026-2027"
            $table->string('budget_type'); // scholarship_benefits, financial_support, etc.
            $table->decimal('requested_amount', 15, 2);
            $table->text('purpose'); // Justification for the request
            $table->text('notes')->nullable(); // Additional notes
            $table->enum('status', ['pending'])->default('pending'); // Always pending (simulation)
            $table->unsignedBigInteger('requested_by_user_id')->nullable();
            $table->string('requested_by_name');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_requests');
    }
};
