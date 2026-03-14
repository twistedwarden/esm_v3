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
        DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'vocational', 'both') NOT NULL DEFAULT 'both'");
    }

    public function down(): void
    {
        // Revert: any 'vocational' rows fall back to 'both' before removing the value
        DB::statement("UPDATE document_types SET level = 'both' WHERE level = 'vocational'");
        DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'both') NOT NULL DEFAULT 'both'");
    }
};
