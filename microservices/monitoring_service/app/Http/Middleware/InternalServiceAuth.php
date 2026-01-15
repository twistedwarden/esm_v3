<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

/**
 * InternalServiceAuth Middleware
 * 
 * Authenticates service-to-service requests for internal API endpoints.
 * Uses shared secrets or service tokens for authentication.
 * 
 * @package App\Http\Middleware
 */
class InternalServiceAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for internal service token
        $serviceToken = $request->header('X-Service-Token');
        $expectedToken = config('services.internal.token');

        // Also accept Bearer token for flexibility
        $authHeader = $request->header('Authorization');
        $bearerToken = null;
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $bearerToken = substr($authHeader, 7);
        }

        // Validate service token
        $isValid = false;

        if ($serviceToken && $expectedToken && $serviceToken === $expectedToken) {
            $isValid = true;
        } elseif ($bearerToken && $this->validateServiceBearerToken($bearerToken)) {
            $isValid = true;
        }

        // In development, allow requests from localhost without authentication
        if (!$isValid && config('app.debug')) {
            $clientIp = $request->ip();
            if (in_array($clientIp, ['127.0.0.1', '::1', 'localhost'])) {
                Log::info('Internal API accessed from localhost in debug mode', [
                    'ip' => $clientIp,
                    'path' => $request->path()
                ]);
                $isValid = true;
            }
        }

        if (!$isValid) {
            Log::warning('Internal API access denied', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'has_service_token' => !empty($serviceToken),
                'has_bearer_token' => !empty($bearerToken)
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Invalid service credentials'
            ], 401);
        }

        // Identify the calling service
        $serviceName = $request->header('X-Service-Name', 'unknown');
        $request->merge(['calling_service' => $serviceName]);

        Log::info('Internal API access granted', [
            'service' => $serviceName,
            'path' => $request->path()
        ]);

        return $next($request);
    }

    /**
     * Validate a Bearer token for service-to-service communication
     * 
     * @param string $token
     * @return bool
     */
    private function validateServiceBearerToken(string $token): bool
    {
        // List of valid service tokens (in production, these should be in database or vault)
        $validTokens = array_filter([
            config('services.scholarship.token'),
            config('services.aid.token'),
            config('services.auth.token'),
        ]);

        return in_array($token, $validTokens);
    }
}
