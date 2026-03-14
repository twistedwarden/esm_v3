<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Modify the level enum on document_types to include 'vocational'.
     * Uses raw SQL because Laravel's Schema builder cannot modify existing enum values.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'vocational', 'all') NOT NULL DEFAULT 'all'");
        DB::statement("UPDATE document_types SET level = 'all' WHERE level = 'both'");
    }

    public function down(): void
    {
        DB::statement("UPDATE document_types SET level = 'both' WHERE level = 'all'");
        DB::statement("UPDATE document_types SET level = 'both' WHERE level = 'vocational'");
        DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'both') NOT NULL DEFAULT 'both'");
    }
};
