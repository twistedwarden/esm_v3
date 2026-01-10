<?php

namespace App\Http\Controllers;

use App\Services\DataCollectionService;
use App\Models\MonitoringMetric;
use App\Models\MonitoringReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class MonitoringController extends Controller
{
    protected $dataCollectionService;
    
    public function __construct(DataCollectionService $dataCollectionService)
    {
        $this->dataCollectionService = $dataCollectionService;
    }
    
    /**
     * Get all metrics
     */
    public function getMetrics(Request $request): JsonResponse
    {
        $cacheKey = 'monitoring_metrics_' . date('Y-m-d-H');
        
        $metrics = Cache::remember($cacheKey, 300, function () {
            return $this->dataCollectionService->collectAllMetrics();
        });
        
        return response()->json([
            'success' => true,
            'data' => $metrics
        ]);
    }
    
    /**
     * Collect and store metrics
     */
    public function collectMetrics(): JsonResponse
    {
        $metrics = $this->dataCollectionService->collectAllMetrics();
        
        // Store in database
        foreach ($metrics as $service => $data) {
            if ($service !== 'timestamp' && $data) {
                MonitoringMetric::create([
                    'metric_name' => $service . '_metrics',
                    'metric_data' => $data,
                    'metric_date' => now()->toDateString(),
                    'notes' => 'Auto-collected metrics'
                ]);
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Metrics collected and stored successfully'
        ]);
    }
    
    /**
     * Get specific metric by name
     */
    public function getMetric(string $metricName): JsonResponse
    {
        $metric = MonitoringMetric::where('metric_name', $metricName)
            ->orderBy('metric_date', 'desc')
            ->first();
        
        if (!$metric) {
            return response()->json([
                'success' => false,
                'message' => 'Metric not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $metric
        ]);
    }
    
    /**
     * List all reports
     */
    public function listReports(Request $request): JsonResponse
    {
        $reports = MonitoringReport::orderBy('generated_at', 'desc')
            ->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }
    
    /**
     * Generate report
     */
    public function generateReport(Request $request): JsonResponse
    {
        $request->validate([
            'report_type' => 'required|in:fund_usage,distribution_efficiency,school_performance,student_trends'
        ]);
        
        $report = MonitoringReport::create([
            'report_type' => $request->report_type,
            'generated_by' => auth()->id(),
            'parameters' => $request->get('parameters', [])
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => $report
        ]);
    }
    
    /**
     * Download report
     */
    public function downloadReport(int $id): JsonResponse
    {
        $report = MonitoringReport::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }
}
