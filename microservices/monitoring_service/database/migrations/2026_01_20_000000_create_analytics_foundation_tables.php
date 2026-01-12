<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Daily Enrollment Snapshot
        // Captures the state of enrollment daily for trend analysis
        Schema::create('analytics_daily_enrollment', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date');
            $table->string('program');
            $table->string('year_level');
            $table->integer('total_students')->default(0);
            $table->integer('active_students')->default(0);
            $table->integer('dropped_students')->default(0);
            $table->integer('graduated_students')->default(0);
            $table->timestamps();

            $table->unique(['snapshot_date', 'program', 'year_level'], 'daily_enrollment_unique');
        });

        // 2. Student Performance Metrics
        // Aggregated performance data for risk analysis
        Schema::create('analytics_student_performance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id')->index(); // ID from Scholarship Service
            $table->string('academic_term'); // e.g., "2025-1"
            $table->decimal('gpa', 5, 2)->nullable();
            $table->decimal('attendance_rate', 5, 2)->nullable(); // 0-100
            $table->integer('failed_subjects_count')->default(0);
            $table->string('risk_level')->default('low'); // low, medium, high
            $table->timestamps();

            $table->index(['academic_term', 'risk_level']);
        });

        // 3. System Health Metrics
        // Basic infrastructure monitoring
        Schema::create('analytics_system_metrics', function (Blueprint $table) {
            $table->id();
            $table->timestamp('recorded_at');
            $table->string('metric_type'); // e.g., 'response_time', 'error_rate', 'active_users'
            $table->float('value');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_system_metrics');
        Schema::dropIfExists('analytics_student_performance');
        Schema::dropIfExists('analytics_daily_enrollment');
    }
};
