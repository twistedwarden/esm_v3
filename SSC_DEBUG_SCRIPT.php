#!/usr/bin/env php
<?php
/**
 * SSC Debug Script - For when tables exist but still getting 500 error
 * 
 * This script will test the exact code path that's failing
 * to identify the real issue.
 * 
 * Usage: php SSC_DEBUG_SCRIPT.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\ScholarshipApplication;
use App\Models\SscReview;

echo "\n========================================\n";
echo "SSC Debug Script - Testing Code Path\n";
echo "========================================\n\n";

// Test 1: Check if we can create an SSC review
echo "1. Testing SscReview model creation...\n";

try {
    // Find an application in 'endorsed_to_ssc' status
    $application = ScholarshipApplication::where('status', 'endorsed_to_ssc')->first();
    
    if (!$application) {
        echo "   ⚠️ No applications in 'endorsed_to_ssc' status found.\n";
        echo "   Creating a test application...\n";
        
        // Create a test application
        $application = ScholarshipApplication::first();
        if ($application) {
            $application->update(['status' => 'endorsed_to_ssc']);
            echo "   ✓ Updated application ID {$application->id} to 'endorsed_to_ssc' status\n";
        } else {
            echo "   ✗ No applications found at all. Cannot test.\n";
            exit(1);
        }
    } else {
        echo "   ✓ Found application ID {$application->id} in 'endorsed_to_ssc' status\n";
    }
    
    // Test creating an SSC review
    $review = new SscReview();
    $review->application_id = $application->id;
    $review->review_stage = 'document_verification';
    $review->reviewer_id = 1; // Test reviewer
    $review->reviewer_role = 'document_verifier';
    $review->status = 'approved';
    $review->review_notes = 'Test review';
    $review->review_data = ['test' => true];
    $review->reviewed_at = now();
    
    $review->save();
    echo "   ✓ Successfully created SSC review record\n";
    echo "   ✓ Review ID: {$review->id}\n";
    
    // Clean up test record
    $review->delete();
    echo "   ✓ Cleaned up test record\n";
    
} catch (\Exception $e) {
    echo "   ✗ ERROR creating SSC review: " . $e->getMessage() . "\n";
    echo "   ✗ Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}

// Test 2: Check the approveStage method
echo "\n2. Testing approveStage method...\n";

try {
    $application = ScholarshipApplication::where('status', 'endorsed_to_ssc')->first();
    
    if ($application) {
        echo "   ✓ Testing approveStage on application ID {$application->id}\n";
        
        // Test the approveStage method
        $result = $application->approveStage(
            'document_verification',
            1, // reviewer ID
            'Test approval',
            ['test' => true]
        );
        
        if ($result) {
            echo "   ✓ approveStage method returned true\n";
            
            // Check if the stage status was updated
            $application->refresh();
            $stageStatus = $application->ssc_stage_status;
            
            if ($stageStatus && isset($stageStatus['document_verification'])) {
                echo "   ✓ Stage status was updated correctly\n";
                echo "   ✓ Stage status: " . json_encode($stageStatus['document_verification']) . "\n";
            } else {
                echo "   ⚠️ Stage status was not updated as expected\n";
            }
            
            // Clean up - reset the application status
            $application->update([
                'ssc_stage_status' => null,
                'all_required_stages_completed' => false,
                'ready_for_final_approval_at' => null
            ]);
            
            // Delete any test reviews
            SscReview::where('application_id', $application->id)
                ->where('review_stage', 'document_verification')
                ->delete();
                
        } else {
            echo "   ✗ approveStage method returned false\n";
        }
    }
    
} catch (\Exception $e) {
    echo "   ✗ ERROR in approveStage method: " . $e->getMessage() . "\n";
    echo "   ✗ Stack trace: " . $e->getTraceAsString() . "\n";
}

// Test 3: Check SSC member assignments
echo "\n3. Testing SSC member assignments...\n";

try {
    $assignment = \App\Models\SscMemberAssignment::where('user_id', 1)->first();
    
    if ($assignment) {
        echo "   ✓ Found SSC assignment for user ID 1\n";
        echo "   ✓ Role: {$assignment->ssc_role}\n";
        echo "   ✓ Active: " . ($assignment->is_active ? 'Yes' : 'No') . "\n";
    } else {
        echo "   ⚠️ No SSC assignment found for user ID 1\n";
        echo "   Creating test assignment...\n";
        
        $assignment = \App\Models\SscMemberAssignment::create([
            'user_id' => 1,
            'ssc_role' => 'document_verifier',
            'is_active' => true,
            'assigned_at' => now()
        ]);
        echo "   ✓ Created test SSC assignment\n";
    }
    
} catch (\Exception $e) {
    echo "   ✗ ERROR with SSC assignments: " . $e->getMessage() . "\n";
}

// Test 4: Simulate the exact controller call
echo "\n4. Testing controller method simulation...\n";

try {
    $application = ScholarshipApplication::where('status', 'endorsed_to_ssc')->first();
    
    if ($application) {
        // Simulate the request data
        $requestData = [
            'verified' => true,
            'notes' => 'Test verification',
            'document_issues' => []
        ];
        
        // Simulate auth user
        $authUser = [
            'id' => 1,
            'role' => 'ssc'
        ];
        
        echo "   ✓ Testing with application ID {$application->id}\n";
        echo "   ✓ Request data: " . json_encode($requestData) . "\n";
        echo "   ✓ Auth user: " . json_encode($authUser) . "\n";
        
        // Test the exact code from the controller
        $reviewerId = $authUser['id'];
        
        $success = $application->approveStage(
            'document_verification',
            $reviewerId,
            $requestData['notes'],
            [
                'document_issues' => $requestData['document_issues'] ?? [],
                'verified_at' => now(),
            ]
        );
        
        if ($success) {
            echo "   ✓ Controller simulation SUCCESSFUL\n";
            
            // Clean up
            $application->update([
                'ssc_stage_status' => null,
                'all_required_stages_completed' => false,
                'ready_for_final_approval_at' => null
            ]);
            
            SscReview::where('application_id', $application->id)
                ->where('review_stage', 'document_verification')
                ->delete();
                
        } else {
            echo "   ✗ Controller simulation FAILED\n";
        }
    }
    
} catch (\Exception $e) {
    echo "   ✗ ERROR in controller simulation: " . $e->getMessage() . "\n";
    echo "   ✗ Stack trace: " . $e->getTraceAsString() . "\n";
}

// Test 5: Check database connection and permissions
echo "\n5. Testing database connection and permissions...\n";

try {
    // Test INSERT
    $testId = DB::table('ssc_reviews')->insertGetId([
        'application_id' => 1,
        'review_stage' => 'test',
        'reviewer_id' => 1,
        'reviewer_role' => 'test',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "   ✓ INSERT test successful (ID: $testId)\n";
    
    // Test UPDATE
    $updated = DB::table('ssc_reviews')->where('id', $testId)->update([
        'status' => 'approved',
        'updated_at' => now()
    ]);
    echo "   ✓ UPDATE test successful ($updated rows affected)\n";
    
    // Test DELETE
    $deleted = DB::table('ssc_reviews')->where('id', $testId)->delete();
    echo "   ✓ DELETE test successful ($deleted rows deleted)\n";
    
} catch (\Exception $e) {
    echo "   ✗ DATABASE ERROR: " . $e->getMessage() . "\n";
    echo "   ✗ This might be the root cause!\n";
}

echo "\n========================================\n";
echo "Debug completed. Check output above for errors.\n";
echo "========================================\n\n";
