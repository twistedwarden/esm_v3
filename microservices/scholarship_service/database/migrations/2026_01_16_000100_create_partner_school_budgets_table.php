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
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('academic_year'); // e.g., "2024-2025"
            $table->string('semester')->nullable(); // e.g., "1st Semester", "Full Year", null for full year
            $table->decimal('allocated_amount', 15, 2)->default(0);
            $table->decimal('spent_amount', 15, 2)->default(0);
            $table->decimal('reserved_amount', 15, 2)->default(0); // Pending applications
            $table->timestamp('allocation_date');
            $table->timestamp('expiry_date')->nullable();
            $table->enum('status', ['active', 'expired', 'depleted'])->default('active');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('allocated_by_user_id')->nullable(); // User ID from auth_service
            $table->timestamps();

            // Indexes for performance
            $table->index(['school_id', 'academic_year', 'semester']);
            $table->index('status');
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
