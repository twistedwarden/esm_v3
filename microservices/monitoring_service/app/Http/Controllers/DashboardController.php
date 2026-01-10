<?php

namespace App\Http\Controllers;

use App\Services\DataCollectionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DashboardController extends Controller
{
    protected $dataCollectionService;
    
    public function __construct(DataCollectionService $dataCollectionService)
    {
        $this->dataCollectionService = $dataCollectionService;
    }
    
    /**
     * Executive Dashboard - High-level KPIs
     */
    public function executive(Request $request): JsonResponse
    {
        $cacheKey = 'executive_dashboard_' . date('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, 3600, function () {
            $metrics = $this->dataCollectionService->collectAllMetrics();
            
            return [
                'budget' => $this->getBudgetMetrics($metrics),
                'beneficiaries' => $this->getBeneficiaryMetrics($metrics),
                'schools' => $this->getSchoolMetrics($metrics),
                'efficiency' => $this->getEfficiencyMetrics($metrics)
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    
    /**
     * Operational Dashboard - Application pipeline
     */
    public function operational(Request $request): JsonResponse
    {
        $cacheKey = 'operational_dashboard_' . date('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, 600, function () {
            $metrics = $this->dataCollectionService->collectAllMetrics();
            $appStats = $this->dataCollectionService->getApplicationStats();
            
            return [
                'pipeline' => $this->getApplicationPipeline($appStats),
                'documents' => $this->getDocumentMetrics($metrics),
                'interviews' => $this->getInterviewMetrics($metrics),
                'alerts' => $this->getAlerts($metrics)
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    
    /**
     * Financial Dashboard
     */
    public function financial(Request $request): JsonResponse
    {
        $cacheKey = 'financial_dashboard_' . date('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, 3600, function () {
            $metrics = $this->dataCollectionService->collectAllMetrics();
            
            return [
                'budget_overview' => $this->getBudgetOverview($metrics),
                'disbursements' => $this->getDisbursementTrends($metrics),
                'payments' => $this->getPaymentStatus($metrics)
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    
    /**
     * Academic Dashboard
     */
    public function academic(Request $request): JsonResponse
    {
        $cacheKey = 'academic_dashboard_' . date('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, 3600, function () {
            $metrics = $this->dataCollectionService->collectAllMetrics();
            $studentStats = $this->dataCollectionService->getStudentStats();
            
            return [
                'student_demographics' => $this->getStudentDemographics($studentStats),
                'performance' => $this->getPerformanceMetrics($metrics),
                'schools' => $this->getSchoolMetrics($metrics)
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    
    /**
     * System Health Dashboard
     */
    public function systemHealth(Request $request): JsonResponse
    {
        $services = [
            'auth_service' => config('services.auth_service.url', 'http://localhost:8000'),
            'scholarship_service' => config('services.scholarship_service.url', 'http://localhost:8001'),
            'aid_service' => config('services.aid_service.url', 'http://localhost:8002')
        ];
        
        $health = [];
        
        foreach ($services as $name => $url) {
            $startTime = microtime(true);
            
            try {
                $response = Http::timeout(3)->get($url . '/api/health');
                $responseTime = round((microtime(true) - $startTime) * 1000);
                
                $health[$name] = [
                    'status' => $response->successful() ? 'online' : 'offline',
                    'response_time_ms' => $responseTime,
                    'last_check' => now()->toISOString()
                ];
            } catch (\Exception $e) {
                $health[$name] = [
                    'status' => 'offline',
                    'response_time_ms' => null,
                    'error' => $e->getMessage(),
                    'last_check' => now()->toISOString()
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $health
        ]);
    }
    
    // Helper methods
    private function getBudgetMetrics($metrics)
    {
        $aidData = $metrics['aid'] ?? null;
        
        return [
            'total' => 45200000, // Default budget
            'disbursed' => $aidData['data']['disbursedAmount'] ?? 0,
            'remaining' => 45200000 - ($aidData['data']['disbursedAmount'] ?? 0),
            'utilization_rate' => $aidData ? (($aidData['data']['disbursedAmount'] ?? 0) / 45200000) * 100 : 0
        ];
    }
    
    private function getBeneficiaryMetrics($metrics)
    {
        $scholarshipData = $metrics['scholarship'] ?? null;
        $studentStats = $this->dataCollectionService->getStudentStats();
        
        return [
            'total_active' => $studentStats['data']['total_students'] ?? 0,
            'new_this_month' => 0, // Can be calculated from date filters
            'approved' => $scholarshipData['data']['approved_applications'] ?? 0,
            'pending' => $scholarshipData['data']['pending_applications'] ?? 0
        ];
    }
    
    private function getSchoolMetrics($metrics)
    {
        // Placeholder - can be enhanced with actual school data
        return [
            'total' => 45,
            'active' => 38
        ];
    }
    
    private function getEfficiencyMetrics($metrics)
    {
        return [
            'avg_processing_time' => 12.5, // Can be calculated from actual data
            'approval_rate' => 78, // Can be calculated
            'rejection_rate' => 12
        ];
    }
    
    private function getApplicationPipeline($appStats)
    {
        if (!$appStats || !isset($appStats['data'])) {
            return [];
        }
        
        $statusCounts = $appStats['data'];
        
        return [
            'draft' => $statusCounts['draft'] ?? 0,
            'submitted' => $statusCounts['submitted'] ?? 0,
            'documents_reviewed' => $statusCounts['documents_reviewed'] ?? 0,
            'endorsed_to_ssc' => $statusCounts['endorsed_to_ssc'] ?? 0,
            'approved' => $statusCounts['approved'] ?? 0,
            'rejected' => $statusCounts['rejected'] ?? 0
        ];
    }
    
    private function getDocumentMetrics($metrics)
    {
        $scholarshipData = $metrics['scholarship'] ?? null;
        
        return [
            'total' => $scholarshipData['data']['total_documents'] ?? 0,
            'verified' => $scholarshipData['data']['verified_documents'] ?? 0,
            'pending' => ($scholarshipData['data']['total_documents'] ?? 0) - ($scholarshipData['data']['verified_documents'] ?? 0)
        ];
    }
    
    private function getInterviewMetrics($metrics)
    {
        // Placeholder - can be enhanced with actual interview data
        return [
            'scheduled_this_week' => 0,
            'completed' => 0,
            'no_show_rate' => 0
        ];
    }
    
    private function getAlerts($metrics)
    {
        return [
            'applications_stuck' => 0,
            'documents_pending' => 0,
            'failed_payments' => 0
        ];
    }
    
    private function getBudgetOverview($metrics)
    {
        return $this->getBudgetMetrics($metrics);
    }
    
    private function getDisbursementTrends($metrics)
    {
        // Placeholder - can be enhanced with historical data
        return [];
    }
    
    private function getPaymentStatus($metrics)
    {
        $aidData = $metrics['aid'] ?? null;
        
        return [
            'completed' => $aidData['data']['disbursedApplications'] ?? 0,
            'processing' => $aidData['data']['processingApplications'] ?? 0,
            'failed' => $aidData['data']['failedApplications'] ?? 0
        ];
    }
    
    private function getStudentDemographics($studentStats)
    {
        if (!$studentStats || !isset($studentStats['data'])) {
            return [];
        }
        
        return [
            'total' => $studentStats['data']['total_students'] ?? 0,
            'enrolled' => $studentStats['data']['students_by_status']['enrolled'] ?? 0,
            'graduated' => $studentStats['data']['students_by_status']['graduated'] ?? 0,
            'average_gpa' => $studentStats['data']['average_gpa'] ?? 0
        ];
    }
    
    private function getPerformanceMetrics($metrics)
    {
        $studentStats = $this->dataCollectionService->getStudentStats();
        
        return [
            'average_gpa' => $studentStats['data']['average_gpa'] ?? 0,
            'retention_rate' => 92.3 // Can be calculated
        ];
    }
}
