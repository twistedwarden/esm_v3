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
        Schema::create('enrollment_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->enum('verification_status', ['pending', 'verified', 'rejected', 'needs_review'])->default('pending');
            $table->foreignId('enrollment_proof_document_id')->nullable()->constrained('documents')->onDelete('set null');
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            $table->string('enrollment_year')->nullable(); // e.g., "2024-2025"
            $table->string('enrollment_term')->nullable(); // e.g., "1st Semester"
            $table->boolean('is_currently_enrolled')->default(false);
            $table->timestamps();

            // Indexes for better performance
            $table->index(['verification_status', 'created_at']);
            $table->index(['school_id', 'verification_status']);
            $table->index(['student_id', 'verification_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_verifications');
    }
};

