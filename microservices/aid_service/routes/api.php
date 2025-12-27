<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SchoolAidController;

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

    // Update application status
    Route::patch('/applications/{id}/status', [SchoolAidController::class, 'updateApplicationStatus']);

    // Process grant for application
    Route::post('/applications/{id}/process-grant', [SchoolAidController::class, 'processGrant']);

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

    // Analytics
    Route::get('/analytics/{type}', function (Request $request, $type) {
        $dateRange = $request->get('range', '30d');
        
        // Mock analytics data
        $data = [
            'applications' => [
                'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                'datasets' => [
                    [
                        'label' => 'Applications',
                        'data' => [25, 30, 28, 35],
                        'borderColor' => 'rgb(59, 130, 246)',
                        'backgroundColor' => 'rgba(59, 130, 246, 0.1)'
                    ]
                ]
            ],
            'payments' => [
                'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                'datasets' => [
                    [
                        'label' => 'Payments',
                        'data' => [15, 20, 18, 25],
                        'borderColor' => 'rgb(34, 197, 94)',
                        'backgroundColor' => 'rgba(34, 197, 94, 0.1)'
                    ]
                ]
            ],
            'amounts' => [
                'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                'datasets' => [
                    [
                        'label' => 'Amount (₱)',
                        'data' => [225000, 300000, 270000, 375000],
                        'borderColor' => 'rgb(168, 85, 247)',
                        'backgroundColor' => 'rgba(168, 85, 247, 0.1)'
                    ]
                ]
            ]
        ];

        return response()->json($data[$type] ?? []);
    });

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
