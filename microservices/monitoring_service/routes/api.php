<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;

Route::get('/analytics/dashboard', [AnalyticsController::class, 'getDashboardMetrics']);
Route::get('/analytics/enrollment-trends', [AnalyticsController::class, 'getEnrollmentTrends']);
Route::get('/analytics/performance-distribution', [AnalyticsController::class, 'getPerformanceDistribution']);
