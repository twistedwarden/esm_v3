<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SchoolAidController;
use App\Http\Controllers\PaymentWebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Aid Service API'
    ]);
});

// School Aid Distribution routes
Route::prefix('school-aid')->group(function () {
    // Applications
    Route::get('/applications', [SchoolAidController::class, 'getApplications']);

    // Disbursement history
    Route::get('/disbursements', [SchoolAidController::class, 'getDisbursementHistory']);
    Route::get('/disbursements/{id}/receipt', [SchoolAidController::class, 'viewDisbursementReceipt']);
    Route::get('/disbursements/{id}/receipt/download', [SchoolAidController::class, 'downloadDisbursementReceipt']);

    // Update application status
    Route::patch('/applications/{id}/status', [SchoolAidController::class, 'updateApplicationStatus']);

    // Process grant for application
    Route::post('/applications/{id}/process-grant', [SchoolAidController::class, 'processGrant']);

    // Revert application status when payment is cancelled
    Route::post('/applications/revert-on-cancel', [SchoolAidController::class, 'revertApplicationOnCancel']);

    // Batch update applications
    Route::patch('/applications/batch-update', [SchoolAidController::class, 'batchUpdateApplications']);

    // Manual Disbursement Process
    Route::post('/applications/{id}/disburse', [SchoolAidController::class, 'processDisbursement']);

    // Payments
    Route::get('/payments', function (Request $request) {
        // Mock payment records
        $payments = [
            [
                'id' => 'pay-1',
                'application_id' => '4',
                'student_name' => 'Ana Garcia',
                'amount' => 16000.00,
                'status' => 'processing',
                'payment_method' => 'bank_transfer',
                'created_at' => '2024-01-22T16:30:00Z'
            ],
            [
                'id' => 'pay-2',
                'application_id' => '5',
                'student_name' => 'Jose Tan',
                'amount' => 12000.00,
                'status' => 'completed',
                'payment_method' => 'bank_transfer',
                'created_at' => '2024-01-23T10:45:00Z',
                'completed_at' => '2024-01-25T14:20:00Z'
            ]
        ];

        // Filter by status
        $status = $request->get('status');
        if ($status) {
            $payments = array_filter($payments, function($payment) use ($status) {
                return $payment['status'] === $status;
            });
        }

        return response()->json(array_values($payments));
    });

    // Process payment
    Route::post('/payments/process', function (Request $request) {
        // Mock payment processing
        return response()->json([
            'id' => 'pay-' . uniqid(),
            'application_id' => $request->input('applicationId'),
            'amount' => 15000.00,
            'status' => 'processing',
            'payment_method' => $request->input('paymentMethod', 'bank_transfer'),
            'created_at' => now()->toISOString()
        ]);
    });

    // Retry payment
    Route::post('/payments/{id}/retry', function (Request $request, $id) {
        // Mock payment retry
        return response()->json([
            'id' => $id,
            'application_id' => '1',
            'amount' => 15000.00,
            'status' => 'processing',
            'payment_method' => 'bank_transfer',
            'created_at' => now()->toISOString()
        ]);
    });

    // Metrics
    Route::get('/metrics', [SchoolAidController::class, 'getMetrics']);
    
    // Get available school years (only those with budgets)
    Route::get('/school-years', [SchoolAidController::class, 'getAvailableSchoolYears']);

    // Budget Management
    Route::get('/budgets', [SchoolAidController::class, 'getBudgets']);
    Route::post('/budget', [SchoolAidController::class, 'createOrUpdateBudget']);

    // Analytics
    Route::get('/analytics/{type}', [SchoolAidController::class, 'getAnalytics']);

    // Settings
    Route::get('/settings', function () {
        return response()->json([
            'payment_methods' => [
                'bank_transfer' => [
                    'enabled' => true,
                    'name' => 'Bank Transfer',
                    'processing_time' => '1-3 business days'
                ],
                'gcash' => [
                    'enabled' => false,
                    'name' => 'GCash',
                    'processing_time' => 'Instant'
                ]
            ],
            'limits' => [
                'max_amount_per_transaction' => 50000.00,
                'daily_limit' => 500000.00,
                'monthly_limit' => 10000000.00
            ],
            'notifications' => [
                'email_enabled' => true,
                'sms_enabled' => false,
                'auto_approve' => false
            ]
        ]);
    });

    Route::put('/settings', function (Request $request) {
        // Mock settings update
        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    });

    Route::post('/settings/test/{type}', function (Request $request, $type) {
        // Mock configuration test
        $success = rand(0, 100) > 30; // 70% success rate
        return response()->json([
            'success' => $success,
            'message' => $success ? 'Test successful' : 'Test failed - check configuration'
        ]);
    });
});

// Payment Webhooks
Route::post('/webhooks/paymongo', [PaymentWebhookController::class, 'handlePaymongoWebhook'])
    ->withoutMiddleware(['csrf']);
