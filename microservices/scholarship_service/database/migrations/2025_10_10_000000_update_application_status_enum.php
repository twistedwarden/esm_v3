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
        // Update the enum values for application status
        // New flow: draft -> submitted -> documents_reviewed -> interview_scheduled -> endorsed_to_ssc -> approved -> grants_processing -> grants_disbursed
        // Fallback statuses: rejected, on_hold, cancelled, for_compliance, compliance_documents_submitted
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to old enum values
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
    }
};

