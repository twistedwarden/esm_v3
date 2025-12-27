#!/usr/bin/env php
<?php
/**
 * Find Application IDs
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ScholarshipApplication;
use Illuminate\Support\Facades\DB;

echo "\n========================================\n";
echo "Finding Applications in 'endorsed_to_ssc' Status\n";
echo "========================================\n\n";

// First check database connection
echo "1. Checking database connection...\n";
try {
    $dbName = DB::connection()->getDatabaseName();
    echo "   ✓ Connected to database: $dbName\n";
} catch (\Exception $e) {
    echo "   ✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Check all applications
echo "\n2. Checking all applications...\n";
$totalApps = DB::table('scholarship_applications')->count();
echo "   Total applications in database: $totalApps\n";

// Check statuses
echo "\n3. Applications by status:\n";
$statuses = DB::table('scholarship_applications')
    ->select('status', DB::raw('COUNT(*) as count'))
    ->groupBy('status')
    ->get();

foreach ($statuses as $status) {
    echo "   - {$status->status}: {$status->count}\n";
}

// Now get endorsed_to_ssc applications
echo "\n4. Getting 'endorsed_to_ssc' applications...\n";
$applications = ScholarshipApplication::where('status', 'endorsed_to_ssc')
    ->with('student')
    ->get();

if ($applications->isEmpty()) {
    echo "No applications found in 'endorsed_to_ssc' status\n";
} else {
    echo "Found {$applications->count()} application(s):\n\n";
    
    foreach ($applications as $app) {
        echo "----------------------------------------\n";
        echo "ID: {$app->id}\n";
        echo "Application Number: {$app->application_number}\n";
        echo "Status: {$app->status}\n";
        echo "Student: {$app->student->first_name} {$app->student->last_name}\n";
        echo "Category ID: {$app->category_id}\n";
        echo "School ID: {$app->school_id}\n";
        echo "Created: {$app->created_at}\n";
        
        // Check SSC stage status
        if ($app->ssc_stage_status) {
            echo "SSC Stages:\n";
            $stages = json_decode(json_encode($app->ssc_stage_status), true);
            foreach ($stages as $stage => $status) {
                echo "  - $stage: " . ($status['status'] ?? 'pending') . "\n";
            }
        } else {
            echo "SSC Stages: None completed yet\n";
        }
        
        echo "\n";
    }
    
    // Show the command to test with the first application
    $firstApp = $applications->first();
    echo "========================================\n";
    echo "To test with application ID {$firstApp->id}, run:\n";
    echo "php artisan tinker\n";
    echo "\n";
    echo "Then paste this:\n";
    echo "\$app = \\App\\Models\\ScholarshipApplication::find({$firstApp->id});\n";
    echo "\$app->approveStage('document_verification', 1, 'Test', []);\n";
    echo "exit\n";
}

echo "\n========================================\n\n";

