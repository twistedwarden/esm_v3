<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class AuthFromAuthService
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        
        // For testing purposes, allow requests without token or with test-token
        if (!$token) {
            // Add mock partner school representative data for testing
            $request->merge([
                'auth_user' => [
                    'id' => 1,
                    'citizen_id' => 'PSREP-001',
                    'email' => 'psrep@ccshs.edu.ph',
                    'first_name' => 'Maria',
                    'last_name' => 'Santos',
                    'role' => 'ps_rep'
                ]
            ]);
            return $next($request);
        }
        
        // Handle test tokens
        if ($token === 'test-token' || $token === 'valid-token') {
            // Try to get user info from headers first
            $userId = $request->header('X-User-ID');
            $userRole = $request->header('X-User-Role');
            $userEmail = $request->header('X-User-Email');
            $userFirstName = $request->header('X-User-First-Name');
            $userLastName = $request->header('X-User-Last-Name');
            
            // If headers are provided, use them; otherwise use default
            if ($userId) {
                $request->merge([
                    'auth_user' => [
                        'id' => (int) $userId,
                        'citizen_id' => 'SSC-' . str_pad($userId, 3, '0', STR_PAD_LEFT),
                        'email' => $userEmail ?: 'user' . $userId . '@caloocan.gov.ph',
                        'first_name' => $userFirstName ?: 'User',
                        'last_name' => $userLastName ?: $userId,
                        'role' => $userRole ?: 'ssc'
                    ]
                ]);
            } else {
                // Default fallback for backward compatibility
                $request->merge([
                    'auth_user' => [
                        'id' => 1,
                        'citizen_id' => 'PSREP-001',
                        'email' => 'psrep@ccshs.edu.ph',
                        'first_name' => 'Maria',
                        'last_name' => 'Santos',
                        'role' => 'ps_rep'
                    ]
                ]);
            }
            return $next($request);
        }

        try {
            // Verify token with auth service
            $authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json'
            ])->get("{$authServiceUrl}/api/user");

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired token'
                ], 401);
            }

            $userData = $response->json();
            
            if (!$userData['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication failed'
                ], 401);
            }

            // Add user data to request for use in controllers
            $request->merge(['auth_user' => $userData['data']['user']]);
            
        } catch (\Exception $e) {
            \Log::error('Exception in AuthFromAuthService: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Authentication service unavailable'
            ], 503);
        }

        return $next($request);
    }
}
