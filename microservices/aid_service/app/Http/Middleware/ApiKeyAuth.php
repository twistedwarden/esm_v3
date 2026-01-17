<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip authentication for health check
        if ($request->is('api/health')) {
            return $next($request);
        }
        
        $apiKey = $request->header('X-API-Key');
        $serviceName = $request->header('X-Service-Name');
        
        // Validate presence of required headers
        if (!$apiKey || !$serviceName) {
            \Log::warning('API key authentication failed - missing headers', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'has_api_key' => !empty($apiKey),
                'has_service_name' => !empty($serviceName)
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Missing authentication headers',
                'error_code' => 'MISSING_AUTH_HEADERS',
                'required_headers' => ['X-API-Key', 'X-Service-Name']
            ], 401);
        }
        
        // Validate API key
        if (!$this->isValidApiKey($apiKey, $serviceName)) {
            \Log::warning('API key authentication failed - invalid credentials', [
                'ip' => $request->ip(),
                'service' => $serviceName,
                'path' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Invalid API key',
                'error_code' => 'INVALID_API_KEY'
            ], 401);
        }
        
        // Add service context to request for use in controllers
        $request->merge(['calling_service' => $serviceName]);
        
        \Log::info('API key authentication successful', [
            'service' => $serviceName,
            'path' => $request->path()
        ]);
        
        return $next($request);
    }
    
    /**
     * Validate API key for the given service
     */
    private function isValidApiKey(?string $apiKey, ?string $serviceName): bool
    {
        if (!$apiKey || !$serviceName) {
            return false;
        }
        
        // Get valid API keys from config
        $validKeys = [
            'auth_service' => config('services.auth_service.api_key'),
            'scholarship_service' => config('services.scholarship_service.api_key'),
            'monitoring_service' => config('services.monitoring_service.api_key'),
        ];
        
        // Check if service exists and key matches
        if (!isset($validKeys[$serviceName])) {
            \Log::warning('Unknown service name', [
                'service' => $serviceName
            ]);
            return false;
        }
        
        // Use timing-safe comparison to prevent timing attacks
        return hash_equals($validKeys[$serviceName], $apiKey);
    }
}
