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
