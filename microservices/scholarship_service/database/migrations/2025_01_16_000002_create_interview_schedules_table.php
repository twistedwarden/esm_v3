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
        Schema::create('interview_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('interview_date');
            $table->time('interview_time');
            $table->string('interview_location')->nullable(); // or "Online"
            $table->enum('interview_type', ['in_person', 'online', 'phone'])->default('in_person');
            $table->string('meeting_link')->nullable(); // for online interviews
            $table->unsignedBigInteger('interviewer_id')->nullable();
            $table->string('interviewer_name');
            $table->enum('scheduling_type', ['automatic', 'manual'])->default('manual');
            $table->enum('status', ['scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->text('interview_notes')->nullable();
            $table->enum('interview_result', ['passed', 'failed', 'needs_followup'])->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('scheduled_by');
            $table->timestamps();

            // Indexes for better performance
            $table->index(['interview_date', 'interview_time']);
            $table->index(['status', 'interview_date']);
            $table->index(['interviewer_id', 'interview_date']);
            $table->index(['student_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_schedules');
    }
};

