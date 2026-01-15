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
        // Application Analytics - Daily snapshots
        Schema::create('analytics_application_daily', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date')->unique();
            
            // Application counts by status
            $table->integer('total_applications')->default(0);
            $table->integer('draft_count')->default(0);
            $table->integer('submitted_count')->default(0);
            $table->integer('reviewed_count')->default(0);
            $table->integer('approved_count')->default(0);
            $table->integer('rejected_count')->default(0);
            $table->integer('processing_count')->default(0);
            $table->integer('released_count')->default(0);
            $table->integer('on_hold_count')->default(0);
            $table->integer('cancelled_count')->default(0);
            
            // Application types
            $table->integer('new_applications')->default(0);
            $table->integer('renewal_applications')->default(0);
            
            // Category breakdown
            $table->integer('merit_count')->default(0);
            $table->integer('need_based_count')->default(0);
            $table->integer('special_count')->default(0);
            
            // Processing metrics
            $table->decimal('avg_processing_days', 5, 2)->default(0);
            $table->integer('applications_submitted_today')->default(0);
            $table->integer('applications_approved_today')->default(0);
            $table->integer('applications_rejected_today')->default(0);
            
            // Amounts
            $table->decimal('total_requested_amount', 15, 2)->default(0);
            $table->decimal('total_approved_amount', 15, 2)->default(0);
            
            $table->timestamps();
            
            $table->index('snapshot_date');
        });

        // Financial Analytics - Daily snapshots
        Schema::create('analytics_financial_daily', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date');
            $table->string('school_year', 20)->nullable();
            
            // Budget tracking
            $table->decimal('total_budget', 15, 2)->default(0);
            $table->decimal('allocated_budget', 15, 2)->default(0);
            $table->decimal('disbursed_budget', 15, 2)->default(0);
            $table->decimal('remaining_budget', 15, 2)->default(0);
            
            // Disbursement metrics
            $table->integer('disbursements_count')->default(0);
            $table->decimal('disbursements_amount', 15, 2)->default(0);
            $table->decimal('avg_disbursement_amount', 12, 2)->default(0);
            
            // By payment method
            $table->decimal('gcash_amount', 15, 2)->default(0);
            $table->decimal('paymaya_amount', 15, 2)->default(0);
            $table->decimal('bank_amount', 15, 2)->default(0);
            $table->decimal('cash_amount', 15, 2)->default(0);
            $table->decimal('other_amount', 15, 2)->default(0);
            
            $table->timestamps();
            
            $table->unique(['snapshot_date', 'school_year']);
            $table->index('snapshot_date');
        });

        // SSC Review Analytics - Daily snapshots
        Schema::create('analytics_ssc_daily', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date')->unique();
            
            // Review counts by stage - Pending
            $table->integer('doc_verification_pending')->default(0);
            $table->integer('financial_review_pending')->default(0);
            $table->integer('academic_review_pending')->default(0);
            $table->integer('final_approval_pending')->default(0);
            
            // Review counts by stage - Completed
            $table->integer('doc_verification_completed')->default(0);
            $table->integer('financial_review_completed')->default(0);
            $table->integer('academic_review_completed')->default(0);
            $table->integer('final_approval_completed')->default(0);
            
            // Review outcomes
            $table->integer('total_approved')->default(0);
            $table->integer('total_rejected')->default(0);
            $table->integer('total_needs_revision')->default(0);
            
            // Performance
            $table->decimal('avg_review_time_hours', 8, 2)->default(0);
            $table->integer('reviews_completed_today')->default(0);
            
            $table->timestamps();
            
            $table->index('snapshot_date');
        });

        // Interview Analytics - Daily snapshots
        Schema::create('analytics_interview_daily', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date')->unique();
            
            // Schedule counts
            $table->integer('scheduled_count')->default(0);
            $table->integer('completed_count')->default(0);
            $table->integer('cancelled_count')->default(0);
            $table->integer('no_show_count')->default(0);
            $table->integer('rescheduled_count')->default(0);
            
            // Results
            $table->integer('passed_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->integer('needs_followup_count')->default(0);
            
            // By type
            $table->integer('in_person_count')->default(0);
            $table->integer('online_count')->default(0);
            $table->integer('phone_count')->default(0);
            
            $table->timestamps();
            
            $table->index('snapshot_date');
        });

        // Demographics Analytics - Daily snapshots
        Schema::create('analytics_demographics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date')->unique();
            
            // Student counts
            $table->integer('total_students')->default(0);
            $table->integer('currently_enrolled')->default(0);
            $table->integer('graduating_students')->default(0);
            $table->integer('new_registrations_today')->default(0);
            
            // Demographics
            $table->integer('male_count')->default(0);
            $table->integer('female_count')->default(0);
            $table->integer('pwd_count')->default(0);
            $table->integer('solo_parent_count')->default(0);
            $table->integer('indigenous_count')->default(0);
            
            // Financial demographics
            $table->integer('fourps_beneficiary_count')->default(0);
            $table->integer('informal_settler_count')->default(0);
            
            // School stats
            $table->integer('partner_schools_count')->default(0);
            $table->integer('caloocan_school_applicants')->default(0);
            
            $table->timestamps();
            
            $table->index('snapshot_date');
        });

        // Alerts table for tracking alert history
        Schema::create('analytics_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('alert_type', 100);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->string('title');
            $table->text('message');
            $table->json('context')->nullable();
            $table->boolean('is_acknowledged')->default(false);
            $table->unsignedBigInteger('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['alert_type', 'severity']);
            $table->index(['is_acknowledged', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_alerts');
        Schema::dropIfExists('analytics_demographics_daily');
        Schema::dropIfExists('analytics_interview_daily');
        Schema::dropIfExists('analytics_ssc_daily');
        Schema::dropIfExists('analytics_financial_daily');
        Schema::dropIfExists('analytics_application_daily');
    }
};
