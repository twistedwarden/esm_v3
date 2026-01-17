<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyRequestSignature
{
    /**
     * Request signature TTL in seconds (5 minutes)
     */
    private const SIGNATURE_TTL = 300;
    
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip signature verification for certain routes
        if ($this->shouldSkipSignature($request)) {
            return $next($request);
        }
        
        $signature = $request->header('X-Signature');
        $timestamp = $request->header('X-Timestamp');
        $serviceName = $request->header('X-Service-Name');
        
        // Validate presence of required headers
        if (!$signature || !$timestamp || !$serviceName) {
            \Log::warning('Request signature verification failed - missing headers', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'has_signature' => !empty($signature),
                'has_timestamp' => !empty($timestamp),
                'has_service_name' => !empty($serviceName)
            ]);
            
            return $this->unauthorizedResponse('Missing signature headers');
        }
        
        // Validate timestamp (prevent replay attacks)
        if (!$this->isValidTimestamp($timestamp)) {
            \Log::warning('Request signature verification failed - invalid timestamp', [
                'service' => $serviceName,
                'timestamp' => $timestamp,
                'current_time' => time(),
                'path' => $request->path()
            ]);
            
            return $this->unauthorizedResponse('Request expired or invalid timestamp');
        }
        
        // Verify signature
        if (!$this->verifySignature($request, $signature, $timestamp, $serviceName)) {
            \Log::warning('Request signature verification failed - invalid signature', [
                'service' => $serviceName,
                'path' => $request->path(),
                'timestamp' => $timestamp,
                'ip' => $request->ip()
            ]);
            
            return $this->unauthorizedResponse('Invalid request signature');
        }
        
        \Log::info('Request signature verified successfully', [
            'service' => $serviceName,
            'path' => $request->path()
        ]);
        
        return $next($request);
    }
    
    /**
     * Verify the request signature
     */
    private function verifySignature(Request $request, string $signature, string $timestamp, string $serviceName): bool
    {
        // Get shared secret for the calling service
        $secret = $this->getSharedSecret($serviceName);
        
        if (!$secret) {
            \Log::error('No shared secret found for service', [
                'service' => $serviceName
            ]);
            return false;
        }
        
        // Build signature payload
        // Format: METHOD|PATH|TIMESTAMP|BODY
        $payload = implode('|', [
            strtoupper($request->method()),
            $request->path(),
            $timestamp,
            $request->getContent()
        ]);
        
        // Calculate expected signature using HMAC-SHA256
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        
        // Timing-safe comparison to prevent timing attacks
        return hash_equals($expectedSignature, $signature);
    }
    
    /**
     * Validate timestamp to prevent replay attacks
     */
    private function isValidTimestamp(string $timestamp): bool
    {
        if (!is_numeric($timestamp)) {
            return false;
        }
        
        $requestTime = (int) $timestamp;
        $currentTime = time();
        
        // Check if timestamp is within acceptable range
        // Allow requests from 5 minutes in the past to 1 minute in the future
        // (to account for clock skew)
        $timeDiff = $currentTime - $requestTime;
        
        return $timeDiff >= -60 && $timeDiff <= self::SIGNATURE_TTL;
    }
    
    /**
     * Get shared secret for the calling service
     */
    private function getSharedSecret(string $serviceName): ?string
    {
        $secrets = [
            'auth_service' => config('services.auth_service.shared_secret'),
            'scholarship_service' => config('services.scholarship_service.shared_secret'),
            'monitoring_service' => config('services.monitoring_service.shared_secret'),
        ];
        
        return $secrets[$serviceName] ?? null;
    }
    
    /**
     * Determine if signature verification should be skipped
     */
    private function shouldSkipSignature(Request $request): bool
    {
        // Skip for health checks and public endpoints
        $skipPaths = [
            'health',
            'api/health',
        ];
        
        foreach ($skipPaths as $path) {
            if ($request->is($path)) {
                return true;
            }
        }
        
        // In development mode, allow skipping signature verification
        if (config('app.debug') && $request->header('X-Skip-Signature') === 'true') {
            \Log::warning('Signature verification skipped in debug mode', [
                'path' => $request->path()
            ]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Generate unauthorized response
     */
    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error_code' => 'INVALID_SIGNATURE'
        ], 401);
    }
}
