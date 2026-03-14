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

echo "Modifying level enum...\n";
DB::statement("ALTER TABLE document_types MODIFY COLUMN level ENUM('college', 'senior_high', 'vocational', 'all') NOT NULL DEFAULT 'all'");
echo "Renaming 'both' -> 'all'...\n";
DB::statement("UPDATE document_types SET level = 'all' WHERE level = 'both'");

$count = DB::table('document_types')->where('level', 'all')->count();
echo "Done. Rows with level='all': {$count}\n";
