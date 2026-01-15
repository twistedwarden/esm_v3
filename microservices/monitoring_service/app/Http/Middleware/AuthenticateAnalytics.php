<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

/**
 * AuthenticateAnalytics Middleware
 * 
 * Authenticates requests to analytics endpoints using Bearer tokens
 * from the central auth service. Also validates role-based access.
 * 
 * @package App\Http\Middleware
 */
class AuthenticateAnalytics
{
    /**
     * Allowed roles for analytics access
     */
    private array $allowedRoles = ['admin', 'staff', 'monitoring'];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $requiredRole Optional specific role requirement
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ?string $requiredRole = null): Response
    {
        // Check for Authorization header
        $authHeader = $request->header('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            Log::warning('Analytics access denied: Missing or invalid authorization header', [
                'ip' => $request->ip(),
                'path' => $request->path()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Missing or invalid token'
            ], 401);
        }

        $token = substr($authHeader, 7); // Remove 'Bearer ' prefix

        // Validate token with auth service
        $user = $this->validateToken($token);

        if (!$user) {
            Log::warning('Analytics access denied: Invalid token', [
                'ip' => $request->ip(),
                'path' => $request->path()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Invalid or expired token'
            ], 401);
        }

        // Check role-based access
        $userRole = $user['role'] ?? 'unknown';
        
        if ($requiredRole && $userRole !== $requiredRole) {
            Log::warning('Analytics access denied: Insufficient permissions', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'user_role' => $userRole,
                'required_role' => $requiredRole
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Forbidden - Insufficient permissions'
            ], 403);
        }

        if (!in_array($userRole, $this->allowedRoles)) {
            Log::warning('Analytics access denied: Role not allowed', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'user_role' => $userRole
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Forbidden - Your role does not have access to analytics'
            ], 403);
        }

        // Attach user info to request
        $request->merge(['auth_user' => $user]);

        // Log successful access
        Log::info('Analytics access granted', [
            'user_id' => $user['id'] ?? 'unknown',
            'user_role' => $userRole,
            'path' => $request->path()
        ]);

        return $next($request);
    }

    /**
     * Validate token with auth service
     * 
     * In production, this should make an HTTP request to the auth service
     * to validate the token. For now, we'll implement a basic validation.
     * 
     * @param string $token
     * @return array|null User data if valid, null otherwise
     */
    private function validateToken(string $token): ?array
    {
        // Get auth service URL from config
        $authServiceUrl = config('services.auth.url', 'http://localhost:8000');
        
        try {
            // Make request to auth service to validate token
            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->timeout(5)
                ->get("{$authServiceUrl}/api/user");

            if ($response->successful()) {
                $data = $response->json();
                if ($data['success'] ?? false) {
                    return $data['data']['user'] ?? null;
                }
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Failed to validate token with auth service', [
                'error' => $e->getMessage()
            ]);

            // For development/testing, allow a fallback
            if (config('app.debug') && ($token === 'test-token' || $token === 'valid-token')) {
                return [
                    'id' => 1,
                    'email' => 'test@example.com',
                    'role' => 'admin',
                    'name' => 'Test Admin'
                ];
            }

            return null;
        }
    }
}
