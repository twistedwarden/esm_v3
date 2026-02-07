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
        // Call the internal API to revert the application status
        try {
            $response = \Illuminate\Support\Facades\Http::post(
                config('app.url') . '/api/school-aid/applications/revert-on-cancel',
                ['application_id' => $applicationId]
            );

            if ($response->successful()) {
                \Illuminate\Support\Facades\Log::info('Payment cancelled and status reverted', [
                    'application_id' => $applicationId,
                    'response' => $response->json()
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to revert status on payment cancel', [
                'application_id' => $applicationId,
                'error' => $e->getMessage()
            ]);
        }
    }

    // Redirect back to applications page
    return redirect($frontendUrl . '/admin/school-aid/applications?cancelled=1');
})->name('payment.mock-cancel');
