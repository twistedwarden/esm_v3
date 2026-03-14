<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend the category enum to include 'renewal' (safe to re-run)
        DB::statement("ALTER TABLE document_types MODIFY COLUMN category ENUM('personal', 'academic', 'financial', 'other', 'renewal') NOT NULL");

        // Ensure 'level' column exists (it should from a prior migration, but be safe)
        if (!Schema::hasColumn('document_types', 'level')) {
            DB::statement("ALTER TABLE document_types ADD COLUMN level ENUM('college','senior_high','vocational','all') NOT NULL DEFAULT 'all' AFTER is_active");
        }

        // Add renewal-specific document types (idempotent)
        $renewalTypes = [
            ['name' => 'Certificate of Registration (Renewal)', 'description' => 'Certificate of Registration/Enrollment for the new term (renewal requirement)'],
            ['name' => 'Certificate of Grades / TOR (Renewal)', 'description' => 'Certificate of Grades or Transcript of Records from the previous term (renewal requirement)'],
            ['name' => 'Other Renewal Document', 'description' => 'Any other supporting document for scholarship renewal'],
        ];

        foreach ($renewalTypes as $type) {
            if (!DB::table('document_types')->where('name', $type['name'])->exists()) {
                DB::table('document_types')->insert([
                    'name'        => $type['name'],
                    'description' => $type['description'],
                    'is_required' => false,
                    'category'    => 'renewal',
                    'is_active'   => true,
                    'level'       => 'all',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('document_types')->where('category', 'renewal')->delete();
    }
};
