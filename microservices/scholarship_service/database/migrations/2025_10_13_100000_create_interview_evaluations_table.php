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
        Schema::create('interview_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_schedule_id')->constrained()->onDelete('cascade');
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('interviewer_id')->nullable();
            $table->string('interviewer_name');
            
            // Scoring fields (1-5 scale)
            $table->integer('academic_motivation_score')->nullable(); // 1-5
            $table->integer('leadership_involvement_score')->nullable(); // 1-5
            $table->integer('financial_need_score')->nullable(); // 1-5
            $table->integer('character_values_score')->nullable(); // 1-5
            
            // Overall evaluation
            $table->enum('overall_recommendation', ['recommended', 'not_recommended', 'needs_followup'])->nullable();
            $table->enum('interview_result', ['passed', 'failed', 'needs_followup'])->nullable();
            
            // Detailed feedback
            $table->text('remarks')->nullable();
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('additional_notes')->nullable();
            
            // Metadata
            $table->timestamp('evaluation_date');
            $table->unsignedBigInteger('evaluated_by');
            $table->timestamps();

            // Indexes for better performance
            $table->index(['interview_schedule_id']);
            $table->index(['application_id']);
            $table->index(['student_id']);
            $table->index(['interviewer_id']);
            $table->index(['interview_result']);
            $table->index(['overall_recommendation']);
            $table->index(['evaluation_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_evaluations');
    }
};
