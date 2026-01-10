<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DataCollectionService
{
    private $authServiceUrl;
    private $scholarshipServiceUrl;
    private $aidServiceUrl;
    
    public function __construct()
    {
        $this->authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');
        $this->scholarshipServiceUrl = config('services.scholarship_service.url', 'http://localhost:8001');
        $this->aidServiceUrl = config('services.aid_service.url', 'http://localhost:8002');
    }
    
    /**
     * Collect data from all services
     */
    public function collectAllMetrics()
    {
        return [
            'auth' => $this->collectAuthMetrics(),
            'scholarship' => $this->collectScholarshipMetrics(),
            'aid' => $this->collectAidMetrics(),
            'timestamp' => now()->toISOString()
        ];
    }
    
    /**
     * Collect metrics from Auth Service
     */
    private function collectAuthMetrics()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->authServiceUrl}/api/users/stats");
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Failed to collect auth metrics: ' . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Collect metrics from Scholarship Service
     */
    private function collectScholarshipMetrics()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->scholarshipServiceUrl}/api/stats/overview");
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Failed to collect scholarship metrics: ' . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Collect metrics from Aid Service
     */
    private function collectAidMetrics()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->aidServiceUrl}/api/school-aid/metrics");
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Failed to collect aid metrics: ' . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Get application statistics from scholarship service
     */
    public function getApplicationStats()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->scholarshipServiceUrl}/api/stats/applications/by-status");
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Failed to get application stats: ' . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Get student statistics
     */
    public function getStudentStats()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->scholarshipServiceUrl}/api/students/statistics");
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Failed to get student stats: ' . $e->getMessage());
        }
        
        return null;
    }
}
