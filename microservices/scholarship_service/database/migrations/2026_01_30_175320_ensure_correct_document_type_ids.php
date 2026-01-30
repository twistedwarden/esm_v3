<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * This migration ensures document types have the correct IDs that match
     * the frontend expectations and the DocumentTypeSeeder order.
     * 
     * Expected IDs:
     * 1 = Birth Certificate
     * 2 = Valid ID
     * 3 = Passport Photo
     * 4 = Barangay Certificate
     * 5 = PWD ID
     * 6 = Solo Parent ID
     * 7 = High School Diploma
     * 8 = High School Transcript of Records
     * 9 = College Transcript of Records
     * 10 = Certificate of Enrollment
     * 11 = Certificate of Good Moral Character
     * 12 = Admission Test Result
     * 13 = Income Tax Return (ITR)
     */
    public function up(): void
    {
        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Create a mapping of document type names to their correct IDs
        $correctMappings = [
            'Birth Certificate' => 1,
            'Valid ID' => 2,
            'Passport Photo' => 3,
            'Barangay Certificate' => 4,
            'PWD ID' => 5,
            'Solo Parent ID' => 6,
            'High School Diploma' => 7,
            'High School Transcript of Records' => 8,
            'College Transcript of Records' => 9,
            'Certificate of Enrollment' => 10,
            'Certificate of Good Moral Character' => 11,
            'Admission Test Result' => 12,
            'Income Tax Return (ITR)' => 13,
        ];

        // Get current document types
        $currentTypes = DB::table('document_types')->get();

        // Create a temporary table to store the new mappings
        DB::statement('CREATE TEMPORARY TABLE temp_doc_type_mapping (old_id INT, new_id INT, name VARCHAR(255))');

        // Build the mapping between old and new IDs
        foreach ($currentTypes as $type) {
            if (isset($correctMappings[$type->name])) {
                $newId = $correctMappings[$type->name];
                DB::table('temp_doc_type_mapping')->insert([
                    'old_id' => $type->id,
                    'new_id' => $newId,
                    'name' => $type->name
                ]);
            }
        }

        // Update documents table to use temporary IDs (add 1000 to avoid conflicts)
        DB::statement('
            UPDATE documents d
            JOIN temp_doc_type_mapping m ON d.document_type_id = m.old_id
            SET d.document_type_id = m.new_id + 1000
        ');

        // Delete all document types
        DB::table('document_types')->truncate();

        // Re-insert document types with correct IDs
        foreach ($correctMappings as $name => $id) {
            $typeData = $currentTypes->firstWhere('name', $name);
            if ($typeData) {
                DB::table('document_types')->insert([
                    'id' => $id,
                    'name' => $name,
                    'description' => $typeData->description,
                    'category' => $typeData->category,
                    'is_required' => $typeData->is_required,
                    'is_active' => $typeData->is_active,
                    'created_at' => $typeData->created_at,
                    'updated_at' => now(),
                ]);
            }
        }

        // Update documents table back to correct IDs (subtract 1000)
        DB::statement('
            UPDATE documents d
            SET d.document_type_id = d.document_type_id - 1000
            WHERE d.document_type_id > 1000
        ');

        // Clean up
        DB::statement('DROP TEMPORARY TABLE temp_doc_type_mapping');

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        echo "Document type IDs have been corrected to match expected values.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        echo "Warning: This migration cannot be automatically reversed.\n";
        echo "Manual intervention would be required to restore the previous state.\n";
    }
};
