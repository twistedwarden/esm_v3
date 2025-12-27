#!/usr/bin/env php
<?php
/**
 * SSC Tables Diagnostic Script
 * 
 * This script checks if all required database tables and columns exist
 * for the SSC multi-stage workflow.
 * 
 * Usage: php check_ssc_tables.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "\n========================================\n";
echo "SSC Database Tables Diagnostic\n";
echo "========================================\n\n";

$allGood = true;

// Check 1: ssc_reviews table
echo "1. Checking 'ssc_reviews' table... ";
if (Schema::hasTable('ssc_reviews')) {
    echo "✓ EXISTS\n";
    
    // Check columns
    $requiredColumns = [
        'id', 'application_id', 'review_stage', 'reviewer_id', 
        'reviewer_role', 'status', 'review_notes', 'review_data', 
        'reviewed_at', 'created_at', 'updated_at'
    ];
    
    foreach ($requiredColumns as $column) {
        echo "   - Column '$column'... ";
        if (Schema::hasColumn('ssc_reviews', $column)) {
            echo "✓\n";
        } else {
            echo "✗ MISSING\n";
            $allGood = false;
        }
    }
} else {
    echo "✗ MISSING\n";
    $allGood = false;
}

// Check 2: scholarship_applications table updates
echo "\n2. Checking 'scholarship_applications' table updates... ";
if (Schema::hasTable('scholarship_applications')) {
    echo "✓ EXISTS\n";
    
    // Check new columns
    $requiredColumns = [
        'ssc_stage_status' => 'JSON column for stage status tracking',
        'all_required_stages_completed' => 'Boolean for workflow completion',
        'ready_for_final_approval_at' => 'Timestamp for final approval readiness'
    ];
    
    foreach ($requiredColumns as $column => $description) {
        echo "   - Column '$column' ($description)... ";
        if (Schema::hasColumn('scholarship_applications', $column)) {
            echo "✓\n";
        } else {
            echo "✗ MISSING\n";
            $allGood = false;
        }
    }
} else {
    echo "✗ MISSING\n";
    $allGood = false;
}

// Check 3: SSC member assignments table
echo "\n3. Checking 'ssc_member_assignments' table... ";
if (Schema::hasTable('ssc_member_assignments')) {
    echo "✓ EXISTS\n";
    
    // Count active assignments
    try {
        $count = DB::table('ssc_member_assignments')->where('is_active', true)->count();
        echo "   - Active SSC members: $count\n";
        if ($count === 0) {
            echo "   ⚠️ WARNING: No active SSC members found. You may need to run seeders.\n";
        }
    } catch (\Exception $e) {
        echo "   ✗ Error counting: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ MISSING\n";
    $allGood = false;
}

// Check 4: Test data existence
echo "\n4. Checking for test applications... ";
try {
    $endorsedCount = DB::table('scholarship_applications')
        ->where('status', 'endorsed_to_ssc')
        ->count();
    echo "$endorsedCount applications in 'endorsed_to_ssc' status\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

// Check 5: Migration status
echo "\n5. Checking migration status... \n";
try {
    $migrations = DB::table('migrations')
        ->where('migration', 'like', '%ssc%')
        ->orWhere('migration', 'like', '%parallel_workflow%')
        ->get();
    
    if ($migrations->isEmpty()) {
        echo "   ⚠️ No SSC-related migrations found in migrations table\n";
        $allGood = false;
    } else {
        foreach ($migrations as $migration) {
            echo "   ✓ " . $migration->migration . " (batch: " . $migration->batch . ")\n";
        }
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Final verdict
echo "\n========================================\n";
if ($allGood) {
    echo "✓ ALL CHECKS PASSED\n";
    echo "The SSC workflow should work correctly.\n";
} else {
    echo "✗ ISSUES FOUND\n";
    echo "Please run the following command to fix:\n";
    echo "  php artisan migrate --force\n";
    echo "\nOr see SSC_DOCUMENT_VERIFICATION_FIX.md for manual fixes.\n";
}
echo "========================================\n\n";

exit($allGood ? 0 : 1);

