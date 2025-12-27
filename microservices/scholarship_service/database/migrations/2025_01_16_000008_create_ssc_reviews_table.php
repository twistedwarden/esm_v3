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
        Schema::create('ssc_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->enum('review_stage', [
                'document_verification',
                'financial_review',
                'academic_review',
                'final_approval'
            ]);
            $table->bigInteger('reviewer_id')->nullable(); // user_id from auth service
            $table->string('reviewer_role')->nullable(); // role name
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'needs_revision'
            ])->default('pending');
            $table->text('review_notes')->nullable();
            $table->json('review_data')->nullable(); // stage-specific data
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index(['application_id', 'review_stage']);
            $table->index(['review_stage', 'status']);
            $table->index(['reviewer_id', 'review_stage']);
            $table->index('reviewed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ssc_reviews');
    }
};
