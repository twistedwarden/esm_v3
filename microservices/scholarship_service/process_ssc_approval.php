<?php

use App\Http\Controllers\ScholarshipApplicationController;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$applicationId = 5;
$application = ScholarshipApplication::find($applicationId);

if (!$application) {
    echo "Application {$applicationId} not found.\n";
    exit(1);
}

echo "Starting SSC Approval Process for App ID: {$applicationId}\n";
echo "Current Status: " . $application->status . "\n";

// Mock Admin User
$adminUser = [
    'id' => 1, // Assumed ID for admin
    'role' => 'admin',
    'first_name' => 'Admin',
    'last_name' => 'User',
    'email' => 'cursorai626@gmail.com'
];

$controller = app(ScholarshipApplicationController::class);

function handleResponse($response, $step)
{
    $content = json_decode($response->getContent(), true);
    if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300 && ($content['success'] ?? false)) {
        echo "[SUCCESS] {$step}\n";
    } else {
        echo "[FAILED] {$step}\n";
        echo "Status: " . $response->getStatusCode() . "\n";
        echo "Error: " . ($content['message'] ?? 'Unknown error') . "\n";
        if (isset($content['error']))
            echo "Details: " . $content['error'] . "\n";
        exit(1);
    }
}

// 1. Document Verification
if ($application->status === 'endorsed_to_ssc') {
    echo "\nProcessing Document Verification...\n";
    $request = new Request([
        'verified' => true,
        'notes' => 'Verified via CLI script',
        'auth_user' => $adminUser
    ]);
    $response = $controller->sscSubmitDocumentVerification($request, $application);
    handleResponse($response, 'Document Verification');
    $application->refresh();
} else {
    echo "\nSkipping Document Verification (Status: " . $application->status . ")\n";
}

// 2. Financial Review
// Note: Depending on parallel settings, we might need to fetch stage status
// The controller checks: if ($application->status !== 'ssc_financial_review')
// BUT the parallel implementation implies generic checks.
// Let's check current status.
// Actually, `sscSubmitDocumentVerification` might NOT change the main status to `ssc_financial_review` if parallel.
// It approves the stage.
// Let's assume parallel workflow allows submitting reviews regardless of 'status' check if status is 'endorsed_to_ssc'?
// Wait, the controller code for Financial Review: `if ($application->status !== 'ssc_financial_review')`
// This suggests sequential.
// But `sscSubmitDocumentVerification` does `$application->approveStage(...)`.
// And `AuditLogService` logging showed `next_stage`.
// Let's see what happens after Doc Verification.

// 3. Financial Review
echo "\nProcessing Financial Review...\n";
// Force status update logic might be needed if the previous step didn't transition it.
// Simulating request.
$request = new Request([
    'feasible' => true,
    'recommended_amount' => 10000,
    'notes' => 'Feasible via CLI script',
    'auth_user' => $adminUser
]);
// We might need to ensure status is correct.
// If sequentially, status should be ssc_financial_review
if ($application->status !== 'ssc_financial_review') {
    // If it's still endorsed_to_ssc, maybe document verif didn't move it?
    // Let's try calling it anyway, or check status
    echo "Current Status: " . $application->status . "\n";
    // Hack: if logic requires specific status, update it for the test?
    // But better to respect logic.
    // If doc verification approved, did it transition?
}

$response = $controller->sscSubmitFinancialReview($request, $application);
if ($response->getStatusCode() === 400) {
    echo "Got 400 for Financial Review. Maybe generic status?\n";
    $content = json_decode($response->getContent(), true);
    echo "Message: " . $content['message'] . "\n";
    // Check if we can proceed.
} else {
    handleResponse($response, 'Financial Review');
}
$application->refresh();

// 4. Academic Review
echo "\nProcessing Academic Review...\n";
$request = new Request([
    'approved' => true,
    'notes' => 'Academic Approved via CLI script',
    'auth_user' => $adminUser
]);
$response = $controller->sscSubmitAcademicReview($request, $application);
handleResponse($response, 'Academic Review');
$application->refresh();

// 5. Final Approval
echo "\nProcessing Final Approval...\n";
$request = new Request([
    'approved_amount' => 10000,
    'notes' => 'Final Approved via CLI script',
    'auth_user' => $adminUser
]);
$response = $controller->sscFinalApproval($request, $application);
handleResponse($response, 'Final Approval');
$application->refresh();

echo "\nFinal Status: " . $application->status . "\n";
echo "SSC Approval Process Completed.\n";
