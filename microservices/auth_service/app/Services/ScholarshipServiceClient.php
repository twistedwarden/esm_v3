<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScholarshipServiceClient
{
    private $baseUrl;
    private $timeout;

    public function __construct()
    {
        $this->baseUrl = env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8001');
        $this->timeout = 10; // 10 seconds timeout
    }

    /**
     * Make a GET request to the scholarship service
     */
    private function get(string $endpoint, array $params = [])
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}{$endpoint}", $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("Scholarship service request failed", [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error("Scholarship service request error", [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get application statistics overview
     */
    public function getApplicationStats()
    {
        $data = $this->get('/api/stats/overview');
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Get applications by status
     */
    public function getApplicationsByStatus()
    {
        $data = $this->get('/api/stats/applications/by-status');
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Get applications by type
     */
    public function getApplicationsByType()
    {
        $data = $this->get('/api/stats/applications/by-type');
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Get applications by subcategory
     */
    public function getApplicationsBySubcategory()
    {
        $data = $this->get('/api/stats/applications/by-subcategory');
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Get recent applications
     */
    public function getRecentApplications(int $limit = 10)
    {
        $data = $this->get('/api/applications', ['limit' => $limit, 'sort' => 'created_at', 'order' => 'desc']);
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Get schools with application counts
     */
    public function getSchools()
    {
        $data = $this->get('/api/schools');
        
        if ($data && isset($data['success']) && $data['success']) {
            return $data['data'] ?? null;
        }

        return null;
    }

    /**
     * Check if the scholarship service is available
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->baseUrl}/api/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
