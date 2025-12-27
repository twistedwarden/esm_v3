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
        // Add the missing SSC status values to the enum
        try {
            DB::statement("ALTER TABLE scholarship_applications MODIFY COLUMN status ENUM(
                'draft',
                'submitted',
                'documents_reviewed',
                'interview_scheduled',
                'interview_completed',
                'endorsed_to_ssc',
                'ssc_document_verification',
                'ssc_financial_review',
                'ssc_academic_review',
                'ssc_final_approval',
                'approved',
                'grants_processing',
                'grants_disbursed',
                'rejected',
                'on_hold',
                'cancelled',
                'for_compliance',
                'compliance_documents_submitted'
            ) DEFAULT 'draft'");
        } catch (\Exception $e) {
            // Migration already applied or column already has these values
            // Log but don't fail
            if (app()->environment('local', 'development')) {
                logger()->info('Enum modification skipped: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the SSC status values
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
    }
};