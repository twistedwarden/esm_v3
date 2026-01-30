<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * This migration fixes incorrect document_type_id mappings in the documents table.
     * Issue: Some documents have the wrong type_id assigned:
     * - Income Certificate documents are incorrectly set to PWD ID (type 5)
     * - Certificate of Enrollment documents are incorrectly set to Passport Photo (type 3)
     */
    public function up(): void
    {
        // First, get the correct document type IDs
        $incomeCertificateTypeId = DB::table('document_types')
            ->where('name', 'Income Certificate')
            ->orWhere('name', 'Income Tax Return (ITR)')
            ->value('id');

        $certificateOfEnrollmentTypeId = DB::table('document_types')
            ->where('name', 'Certificate of Enrollment')
            ->value('id');

        $pwdIdTypeId = DB::table('document_types')
            ->where('name', 'PWD ID')
            ->value('id');

        $passportPhotoTypeId = DB::table('document_types')
            ->where('name', 'Passport Photo')
            ->value('id');

        if (!$incomeCertificateTypeId || !$certificateOfEnrollmentTypeId) {
            // Log warning if document types don't exist
            echo "Warning: Required document types not found. Skipping migration.\n";
            return;
        }

        // Fix Income Certificate documents that are incorrectly marked as PWD ID
        // We identify them by checking if the file name contains "income" or similar keywords
        if ($pwdIdTypeId) {
            DB::table('documents')
                ->where('document_type_id', $pwdIdTypeId)
                ->where(function ($query) {
                    $query->where('file_name', 'like', '%income%')
                        ->orWhere('file_name', 'like', '%ITR%')
                        ->orWhere('file_name', 'like', '%tax%');
                })
                ->update(['document_type_id' => $incomeCertificateTypeId]);
        }

        // Fix Certificate of Enrollment documents that are incorrectly marked as Passport Photo
        // We identify them by checking if the file name contains "enrollment", "enrol", "COE" or similar keywords
        if ($passportPhotoTypeId) {
            DB::table('documents')
                ->where('document_type_id', $passportPhotoTypeId)
                ->where(function ($query) {
                    $query->where('file_name', 'like', '%enrollment%')
                        ->orWhere('file_name', 'like', '%enrol%')
                        ->orWhere('file_name', 'like', '%COE%')
                        ->orWhere('file_name', 'like', '%certificate%');
                })
                ->update(['document_type_id' => $certificateOfEnrollmentTypeId]);
        }

        echo "Document type mappings have been corrected.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be easily reversed as we don't know the original incorrect state
        // Manual intervention would be required to restore the incorrect mappings
        echo "Warning: This migration cannot be automatically reversed.\n";
    }
};
