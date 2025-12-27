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
        // Add new workflow statuses to the existing enum
        DB::statement("ALTER TABLE scholarship_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'documents_reviewed',
            'approved_pending_verification',
            'enrollment_verified',
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous enum values (without the new workflow statuses)
        DB::statement("ALTER TABLE scholarship_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'documents_reviewed',
            'interview_scheduled',
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





