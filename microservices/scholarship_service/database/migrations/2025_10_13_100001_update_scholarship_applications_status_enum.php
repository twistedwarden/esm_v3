<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the status enum to include interview-related statuses
        DB::statement("ALTER TABLE scholarship_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'documents_reviewed',
            'interview_scheduled',
            'interview_completed',
            'endorsed_to_ssc',
            'approved',
            'grants_processing',
            'grants_disbursed',
            'rejected',
            'on_hold',
            'cancelled',
            'for_compliance',
            'compliance_documents_submitted'
        ) DEFAULT 'draft'");
        
        // Add interview-related columns if they don't exist
        if (!Schema::hasColumn('scholarship_applications', 'interview_completed_at')) {
            Schema::table('scholarship_applications', function (Blueprint $table) {
                $table->timestamp('interview_completed_at')->nullable();
                $table->unsignedBigInteger('interview_completed_by')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original status enum
        DB::statement("ALTER TABLE scholarship_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'reviewed',
            'approved',
            'processing',
            'released',
            'rejected',
            'on_hold',
            'cancelled'
        ) DEFAULT 'draft'");
        
        // Remove interview-related columns
        if (Schema::hasColumn('scholarship_applications', 'interview_completed_at')) {
            Schema::table('scholarship_applications', function (Blueprint $table) {
                $table->dropColumn(['interview_completed_at', 'interview_completed_by']);
            });
        }
    }
};
