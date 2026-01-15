<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update applications with 'document_review' status to 'under_review'
        DB::table('partner_school_applications')
            ->where('status', 'document_review')
            ->update(['status' => 'under_review']);

        // Alter the enum to remove 'document_review'
        DB::statement("ALTER TABLE partner_school_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'withdrawn'
        ) DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous enum with 'document_review'
        DB::statement("ALTER TABLE partner_school_applications MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'under_review',
            'document_review',
            'approved',
            'rejected',
            'withdrawn'
        ) DEFAULT 'draft'");
    }
};
