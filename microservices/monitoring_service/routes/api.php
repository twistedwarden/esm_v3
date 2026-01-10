<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

// Health check
Route::get('/health', [HealthController::class, 'health']);

// Dashboard endpoints
Route::prefix('dashboard')->group(function () {
    Route::get('/executive', [DashboardController::class, 'executive']);
    Route::get('/operational', [DashboardController::class, 'operational']);
    Route::get('/financial', [DashboardController::class, 'financial']);
    Route::get('/academic', [DashboardController::class, 'academic']);
    Route::get('/system-health', [DashboardController::class, 'systemHealth']);
});

// Metrics endpoints
Route::prefix('metrics')->group(function () {
    Route::get('/', [MonitoringController::class, 'getMetrics']);
    Route::post('/collect', [MonitoringController::class, 'collectMetrics']);
    Route::get('/{metric_name}', [MonitoringController::class, 'getMetric']);
});

// Reports endpoints
Route::prefix('reports')->group(function () {
    Route::get('/', [MonitoringController::class, 'listReports']);
    Route::post('/generate', [MonitoringController::class, 'generateReport']);
    Route::get('/{id}/download', [MonitoringController::class, 'downloadReport']);
});
