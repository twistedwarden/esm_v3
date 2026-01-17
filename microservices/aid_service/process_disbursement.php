<?php

use App\Http\Controllers\SchoolAidController;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$applicationId = 5;
$application = ScholarshipApplication::find($applicationId);

if (!$application) {
    echo "Application {$applicationId} not found.\n";
    exit(1);
}

echo "Starting Disbursement Process for App ID: {$applicationId}\n";
echo "Current Status: " . $application->status . "\n";

if ($application->status !== 'approved') {
    if ($application->status === 'grants_disbursed') {
        echo "Application already disbursed.\n";
        exit(0);
    }
    // If it's grants_processing, we can skip to disbursement
    if ($application->status !== 'grants_processing') {
        echo "Application is not in approved state. Cannot process.\n";
        exit(1);
    }
}

$controller = app(SchoolAidController::class);
$adminUser = [
    'id' => 1,
    'name' => 'Admin User'
];

// Step 1: Process Grant (Approved -> Grants Processing)
if ($application->status === 'approved') {
    echo "\nProcessing Grant (Initiating Payment Link)...\n";
    $request = new Request([
        'user_id' => $adminUser['id'],
        'user_name' => $adminUser['name']
    ]);

    $response = $controller->processGrant($request, $applicationId);
    $content = json_decode($response->getContent(), true);

    if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
        echo "[SUCCESS] Grant Processed. Status: " . ($content['new_status'] ?? 'unknown') . "\n";
        $application->refresh();
    } else {
        echo "[FAILED] Process Grant\n";
        echo "Error: " . ($content['message'] ?? 'Unknown') . "\n";
        exit(1);
    }
} else {
    echo "\nSkipping Process Grant (Current Status: " . $application->status . ")\n";
}

// Step 2: Process Disbursement (Grants Processing -> Grants Disbursed)
if (in_array($application->status, ['grants_processing', 'pending_disbursement'])) {
    echo "\nProcessing Disbursement (Upload Receipt)...\n";

    // Mock File
    Storage::fake('public');
    $file = UploadedFile::fake()->create('receipt.jpg', 100);

    $request = new Request();
    $request->merge([
        'method' => 'bank_transfer',
        'providerName' => 'Landbank',
        'referenceNumber' => 'REF-' . time(),
        'notes' => 'Disbursed via CLI script',
        'disbursedById' => $adminUser['id'],
        'disbursedByName' => $adminUser['name']
    ]);
    $request->files->set('receiptFile', $file);

    // We need to bypass validation in the controller? No, Request object handling in controller relies on global request or passed request?
    // The controller method signature is processDisbursement(Request $request, $id)
    // So passing our mocked request should work for validation.

    $response = $controller->processDisbursement($request, $applicationId);
    $content = json_decode($response->getContent(), true);

    if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
        echo "[SUCCESS] Disbursement Processed.\n";
        if (isset($content['application']['status'])) {
            echo "New Status: " . $content['application']['status'] . "\n";
        }
    } else {
        echo "[FAILED] Process Disbursement\n";
        echo "Error: " . ($content['message'] ?? json_encode($content)) . "\n";
        if (isset($content['details']))
            print_r($content['details']);
        exit(1);
    }
} else {
    echo "\nCannot process disbursement. Status is " . $application->status . "\n";
}

$application->refresh();
echo "\nFinal Status: " . $application->status . "\n";
