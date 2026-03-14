<?php
/**
 * One-time fix script: run from the scholarship_service root.
 * Usage: php fix_level_enum.php
 * Delete this file after running.
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Step 1: Temporarily allow the old 'both' value alongside the new ones by expanding the enum first,
// keeping 'both' in the list so existing rows don't truncate.
echo "Step 1: Expanding enum to include both old and new values...\n";
DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'vocational', 'both', 'all') NOT NULL DEFAULT 'both'");

// Step 2: Migrate all 'both' rows to 'all'.
echo "Step 2: Renaming 'both' -> 'all'...\n";
DB::statement("UPDATE document_types SET level = 'all' WHERE level = 'both'");

// Step 3: Now drop 'both' from the enum and set default to 'all'.
echo "Step 3: Finalising enum (removing 'both', setting default 'all')...\n";
DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'vocational', 'all') NOT NULL DEFAULT 'all'");

$count = DB::table('document_types')->where('level', 'all')->count();
echo "Done. Rows with level='all': {$count}\n";
