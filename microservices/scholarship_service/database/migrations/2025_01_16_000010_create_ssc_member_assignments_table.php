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
        Schema::create('ssc_member_assignments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id'); // user_id from auth service
            $table->enum('ssc_role', [
                'chairperson',
                'budget_dept',
                'accounting',
                'treasurer',
                'education_affairs',
                'qcydo',
                'planning_dept',
                'city_council',
                'hrd',
                'social_services',
                'schools_division',
                'qcu'
            ]);
            $table->enum('review_stage', [
                'document_verification',
                'financial_review',
                'academic_review',
                'final_approval'
            ]);
            $table->boolean('is_active')->default(true);
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'ssc_role']);
            $table->index(['review_stage', 'is_active']);
            $table->index('user_id');
            
            // Unique constraint - one user can have one role per stage
            $table->unique(['user_id', 'ssc_role', 'review_stage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ssc_member_assignments');
    }
};
