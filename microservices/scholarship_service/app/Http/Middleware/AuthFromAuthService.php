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
        // Development fallback - allows requests without token
        if (!$token) {
            \Log::warning('AuthFromAuthService: No token provided - using development fallback', [
                'path' => $request->path(),
                'method' => $request->method()
            ]);

            // DEVELOPMENT FALLBACK - This allows requests without tokens
            $request->merge([
                'auth_user' => [
                    'id' => 100,  // Your actual user ID
                    'citizen_id' => 'ADM001',
                    'email' => 'cursorai626@gmail.com',  // Your actual email
                    'first_name' => 'System',
                    'last_name' => 'Administrator',
                    'role' => 'admin'  // Super admin role
                ]
            ]);
            return $next($request);
        }

        \Log::info('AuthFromAuthService: Token found', [
            'token_length' => strlen($token),
            'token_prefix' => substr($token, 0, 10) . '...'
        ]);

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
                // Default fallback for test tokens without headers
                $request->merge([
                    'auth_user' => [
                        'id' => 1,
                        'citizen_id' => 'ADMIN-001',
                        'email' => 'admin@caloocan.gov.ph',
                        'first_name' => 'System',
                        'last_name' => 'Administrator',
                        'role' => 'admin'  // Super admin role
                    ]
                ]);
            }
            return $next($request);
        }

        try {
            // Verify token with auth service
            $authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');

            \Log::info('AuthFromAuthService: Verifying token', [
                'auth_service_url' => $authServiceUrl,
                'token_length' => strlen($token),
                'endpoint' => "{$authServiceUrl}/api/user"
            ]);

            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json'
                ])
                ->get("{$authServiceUrl}/api/user");

            \Log::info('AuthFromAuthService: Auth service response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                \Log::warning('AuthFromAuthService: Token verification failed', [
                    'status' => $response->status(),
                    'error' => $errorBody
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired token',
                    'error' => $response->status() === 401 ? 'Unauthorized' : 'Authentication service error'
                ], 401);
            }

            $userData = $response->json();

            if (!isset($userData['success']) || !$userData['success']) {
                \Log::warning('AuthFromAuthService: Invalid response format', [
                    'response' => $userData
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication failed - invalid response format'
                ], 401);
            }

            if (!isset($userData['data']['user'])) {
                \Log::warning('AuthFromAuthService: Missing user data in response', [
                    'response' => $userData
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication failed - user data not found'
                ], 401);
            }

            // Add user data to request for use in controllers
            $request->merge(['auth_user' => $userData['data']['user']]);

            \Log::info('AuthFromAuthService: Authentication successful', [
                'user_id' => $userData['data']['user']['id'] ?? null,
                'role' => $userData['data']['user']['role'] ?? null
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            \Log::error('AuthFromAuthService: Connection exception', [
                'message' => $e->getMessage(),
                'auth_service_url' => $authServiceUrl
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Authentication service unavailable - connection failed'
            ], 503);
        } catch (\Exception $e) {
            \Log::error('AuthFromAuthService: Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Authentication service unavailable'
            ], 503);
        }

        return $next($request);
    }
}
