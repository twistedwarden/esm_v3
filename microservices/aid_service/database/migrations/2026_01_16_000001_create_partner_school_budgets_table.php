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
        Schema::create('partner_school_budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id'); // From scholarship_service
            $table->string('school_name'); // Cached for display
            $table->string('academic_year'); // e.g., "2024-2025"

            // Budget tracking
            $table->decimal('allocated_amount', 15, 2)->default(0);
            $table->decimal('disbursed_amount', 15, 2)->default(0);
            // available_amount computed: allocated - disbursed

            // Lifecycle
            $table->timestamp('allocation_date');
            $table->timestamp('expiry_date')->nullable();
            $table->enum('status', ['active', 'expired', 'depleted'])->default('active');

            // Metadata
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('allocated_by_user_id')->nullable(); // From auth_service

            $table->timestamps();

            // Constraints
            $table->unique(['school_id', 'academic_year']);
            $table->index('status');
            $table->index('academic_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_budgets');
    }
};
