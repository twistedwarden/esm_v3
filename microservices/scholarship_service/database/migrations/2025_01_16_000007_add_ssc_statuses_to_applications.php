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
        // Add new SSC stage status values to the enum
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the new SSC status values
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
