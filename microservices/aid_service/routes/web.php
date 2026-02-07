<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Mock Payment Routes (for demo when PayMongo is unavailable)
Route::get('/payment/mock-checkout/{id}', function ($id) {
    $frontendUrl = config('payment.frontend.current');

    // Parse the application ID from the payment ID (format: mock_xxx)
    // We'll use session or query param to get application ID
    $applicationId = request('application_id');

    return view('mock-checkout', [
        'paymentId' => $id,
        'applicationId' => $applicationId,
        'amount' => request('amount', 50000),
        'frontendUrl' => $frontendUrl,
    ]);
})->name('payment.mock-checkout');

Route::post('/payment/mock-complete/{id}', function ($id) {
    $frontendUrl = config('payment.frontend.current');
    $applicationId = request('application_id');

    // Redirect to success page
    return redirect($frontendUrl . '/admin/school-aid/payment/success?application_id=' . $applicationId . '&payment_id=' . $id);
})->name('payment.mock-complete');

Route::post('/payment/mock-cancel', function () {
    $frontendUrl = config('payment.frontend.current');
    $applicationId = request('application_id');

    if ($applicationId) {
        try {
            // Directly update the application status
            $application = \App\Models\ScholarshipApplication::find($applicationId);

            if ($application) {
                $oldStatus = $application->status;

                // Only revert if status is grants_processing
                if ($application->status === 'grants_processing') {
                    $application->status = 'approved';
                    $application->save();

                    // Log the cancellation
                    \App\Services\AuditLogService::logAction(
                        'payment_cancelled',
                        "Payment cancelled for application #{$application->application_number}. Status reverted from {$oldStatus} to approved.",
                        'scholarship_application',
                        (string) $application->id,
                        null,
                        [
                            'previous_status' => $oldStatus,
                            'new_status' => 'approved',
                            'reason' => 'Payment cancelled by user from mock checkout'
                        ]
                    );

                    \Illuminate\Support\Facades\Log::info('Payment cancelled and status reverted', [
                        'application_id' => $applicationId,
                        'old_status' => $oldStatus,
                        'new_status' => 'approved'
                    ]);
                } else {
                    \Illuminate\Support\Facades\Log::info('Payment cancelled but status not reverted', [
                        'application_id' => $applicationId,
                        'current_status' => $application->status,
                        'reason' => 'Status is not grants_processing'
                    ]);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('Payment cancelled but application not found', [
                    'application_id' => $applicationId
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to revert status on payment cancel', [
                'application_id' => $applicationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    // Redirect back to applications page
    return redirect($frontendUrl . '/admin/school-aid/applications?cancelled=1');
})->name('payment.mock-cancel');
