#!/usr/bin/env php
<?php
/**
 * Debug SSC Document Verification Error
 * Run this to see the actual error message
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ScholarshipApplication;
use App\Models\SscMemberAssignment;

echo "\n========================================\n";
echo "SSC Document Verification Debug\n";
echo "========================================\n\n";

// Test with APP-2025-000002 (ID should be 2 based on your screenshot)
$applicationId = 4; // Change this if needed

echo "1. Checking application...\n";
$app = ScholarshipApplication::find($applicationId);

if (!$app) {
    echo "   ✗ Application ID $applicationId not found!\n";
    exit(1);
}

echo "   ✓ Found application: {$app->application_number}\n";
echo "   ✓ Status: {$app->status}\n";
echo "   ✓ Student ID: {$app->student_id}\n";

// Check if status is correct
if (!in_array($app->status, ['endorsed_to_ssc', 'ssc_final_approval'])) {
    echo "   ✗ ERROR: Status is '{$app->status}' but must be 'endorsed_to_ssc' or 'ssc_final_approval'\n";
    exit(1);
}

echo "\n2. Testing approveStage method...\n";

try {
    // Simulate what happens when you click approve
    $authUser = ['id' => 1]; // Test with user ID 1
    $reviewerId = $authUser['id'];
    
    echo "   Testing with reviewer ID: $reviewerId\n";
    
    // Check if user has SSC assignment
    $assignment = SscMemberAssignment::where('user_id', $reviewerId)
        ->where('is_active', true)
        ->first();
    
    if ($assignment) {
        echo "   ✓ User has SSC assignment: {$assignment->ssc_role}\n";
    } else {
        echo "   ⚠️ User has NO SSC assignment\n";
        echo "   Creating test assignment...\n";
        
        $assignment = SscMemberAssignment::create([
            'user_id' => $reviewerId,
            'ssc_role' => 'document_verifier',
            'is_active' => true,
            'assigned_at' => now()
        ]);
        echo "   ✓ Created test SSC assignment\n";
    }
    
    // Now test the actual approval
    echo "\n3. Running approveStage...\n";
    
    $success = $app->approveStage(
        'document_verification',
        $reviewerId,
        'Test approval - debugging',
        [
            'document_issues' => [],
            'verified_at' => now(),
        ]
    );
    
    if ($success) {
        echo "   ✓✓✓ SUCCESS! Document verification approved\n";
        
        // Check the updated status
        $app->refresh();
        echo "   ✓ Application status: {$app->status}\n";
        echo "   ✓ Stage status: " . json_encode($app->ssc_stage_status) . "\n";
        
        // Clean up the test approval
        echo "\n   Cleaning up test data...\n";
        $app->update([
            'ssc_stage_status' => null,
            'all_required_stages_completed' => false,
            'ready_for_final_approval_at' => null
        ]);
        
        \App\Models\SscReview::where('application_id', $app->id)
            ->where('review_stage', 'document_verification')
            ->delete();
            
        echo "   ✓ Test data cleaned up\n";
        
    } else {
        echo "   ✗✗✗ FAILED! approveStage returned false\n";
        echo "   Check Laravel logs for more details\n";
    }
    
} catch (\Exception $e) {
    echo "   ✗✗✗ ERROR CAUGHT!\n";
    echo "   Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\n   Stack trace:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n========================================\n";
echo "Debug complete\n";
echo "========================================\n\n";

