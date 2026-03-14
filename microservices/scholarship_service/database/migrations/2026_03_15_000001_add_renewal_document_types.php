<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add renewal-specific document types
        $renewalTypes = [
            [
                'name' => 'Certificate of Registration (Renewal)',
                'description' => 'Certificate of Registration/Enrollment for the new term (renewal requirement)',
                'is_required' => false,
                'category' => 'renewal',
                'is_active' => true,
                'level' => 'all',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Certificate of Grades / TOR (Renewal)',
                'description' => 'Certificate of Grades or Transcript of Records from the previous term (renewal requirement)',
                'is_required' => false,
                'category' => 'renewal',
                'is_active' => true,
                'level' => 'all',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Other Renewal Document',
                'description' => 'Any other supporting document for scholarship renewal',
                'is_required' => false,
                'category' => 'renewal',
                'is_active' => true,
                'level' => 'all',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($renewalTypes as $type) {
            // Only insert if it doesn't already exist
            if (!DB::table('document_types')->where('name', $type['name'])->exists()) {
                DB::table('document_types')->insert($type);
            }
        }
    }

    public function down(): void
    {
        DB::table('document_types')->where('category', 'renewal')->delete();
    }
};
