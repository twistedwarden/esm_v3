<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AIAnalyticsController;
use App\Http\Controllers\AnalyticsIngestionController;

/*
|--------------------------------------------------------------------------
| API Routes - Analytics & Monitoring
|--------------------------------------------------------------------------
*/

// Health check (always public)
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'service' => 'monitoring_service',
        'status' => 'healthy',
        'timestamp' => now()->toIso8601String()
    ]);
});

// Core Analytics Endpoints
Route::prefix('analytics')->group(function () {

    // =========================================================================
    // Executive Dashboard
    // =========================================================================
    Route::get('/dashboard', [AnalyticsController::class, 'getDashboardMetrics']);
    Route::get('/filter-options', [AnalyticsController::class, 'getFilterOptions']);

    // =========================================================================
    // Application Pipeline Analytics
    // =========================================================================
    Route::get('/applications/trends', [AnalyticsController::class, 'getApplicationTrends']);

    // =========================================================================
    // Financial/Budget Analytics
    // =========================================================================
    Route::get('/financial/trends', [AnalyticsController::class, 'getFinancialTrends']);

    // =========================================================================
    // SSC Review Analytics
    // =========================================================================
    Route::get('/ssc/trends', [AnalyticsController::class, 'getSscReviewTrends']);

    // =========================================================================
    // Interview Analytics
    // =========================================================================
    Route::get('/interviews/trends', [AnalyticsController::class, 'getInterviewTrends']);

    // =========================================================================
    // Demographics Analytics
    // =========================================================================
    Route::get('/demographics/trends', [AnalyticsController::class, 'getDemographicsTrends']);

    // =========================================================================
    // Alerts
    // =========================================================================
    Route::get('/alerts', [AnalyticsController::class, 'getAlerts']);
    Route::post('/alerts/{id}/acknowledge', [AnalyticsController::class, 'acknowledgeAlert']);

    // =========================================================================
    // System Health
    // =========================================================================
    Route::get('/system-overview', [AnalyticsController::class, 'getSystemOverview']);

    // =========================================================================
    // AI-Powered Insights
    // =========================================================================
    Route::prefix('ai')->group(function () {
        Route::get('/insights', [AIAnalyticsController::class, 'getInsights']);
        Route::get('/status', [AIAnalyticsController::class, 'getStatus']);
    });

    // =========================================================================
    // Academic Performance
    // =========================================================================
    Route::get('/academic-performance', [AnalyticsController::class, 'getAcademicPerformance']);

    // =========================================================================
    // Enrollment Statistics
    // =========================================================================
    Route::get('/enrollment-statistics', [AnalyticsController::class, 'getEnrollmentStatistics']);

    // =========================================================================
    // Student Progress
    // =========================================================================
    Route::get('/student-progress', [AnalyticsController::class, 'getStudentProgress']);

    // =========================================================================
    // Analytics Charts
    // =========================================================================
    Route::get('/analytics-charts', [AnalyticsController::class, 'getAnalyticsCharts']);

    // =========================================================================
    // Legacy Endpoints (backward compatibility)
    // =========================================================================
    Route::get('/enrollment-trends', [AnalyticsController::class, 'getEnrollmentTrends']);
    Route::get('/performance-distribution', [AnalyticsController::class, 'getPerformanceDistribution']);
});

/*
|--------------------------------------------------------------------------
| Internal API Routes - Data Ingestion
|--------------------------------------------------------------------------
*/

Route::prefix('internal/analytics')->group(function () {
    // Application analytics ingestion
    Route::post('/application-snapshot', [AnalyticsIngestionController::class, 'ingestApplicationSnapshot']);

    // Financial analytics ingestion
    Route::post('/financial-snapshot', [AnalyticsIngestionController::class, 'ingestFinancialSnapshot']);

    // SSC review analytics ingestion
    Route::post('/ssc-snapshot', [AnalyticsIngestionController::class, 'ingestSscSnapshot']);

    // Interview analytics ingestion
    Route::post('/interview-snapshot', [AnalyticsIngestionController::class, 'ingestInterviewSnapshot']);

    // Demographics analytics ingestion
    Route::post('/demographics-snapshot', [AnalyticsIngestionController::class, 'ingestDemographicsSnapshot']);

    // Legacy endpoints
    Route::post('/enrollment-snapshot', [AnalyticsIngestionController::class, 'ingestEnrollmentSnapshot']);
    Route::post('/performance-snapshot', [AnalyticsIngestionController::class, 'ingestPerformanceSnapshot']);
    Route::post('/system-metrics', [AnalyticsIngestionController::class, 'ingestSystemMetrics']);

    // Trigger sync endpoint - called by scholarship service when events occur
    Route::post('/trigger-sync', [AnalyticsIngestionController::class, 'triggerSync']);
});
