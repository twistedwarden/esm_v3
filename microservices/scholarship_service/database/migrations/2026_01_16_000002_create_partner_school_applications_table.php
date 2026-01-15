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
        Schema::create('partner_school_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable(); // Links to schools table if school exists
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('submitted_by')->nullable(); // Admin user ID
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
            
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->index('status');
            $table->index('school_id');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_applications');
    }
};
