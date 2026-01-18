<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Execute request
        $response = $next($request);

        // Calculate response time
        $responseTime = (microtime(true) - $startTime) * 1000;

        // Skip logging for excluded endpoints
        if ($this->shouldSkipLogging($request)) {
            return $response;
        }

        // Skip if this is a duplicate request (same user, path, method within 5 seconds)
        if ($this->isDuplicateRequest($request)) {
            return $response;
        }

        // Log the request
        $this->logRequest($request, $response, $responseTime);

        return $response;
    }

    /**
     * Determine if the request should be logged
     */
    private function shouldSkipLogging(Request $request): bool
    {
        $path = $request->path();
        $method = $request->method();

        // Excluded paths to prevent log bloat
        $excludedPaths = [
            'health',
            'ping',
            'api/audit-logs', // Prevent recursive logging
            'sanctum/csrf-cookie',
        ];

        foreach ($excludedPaths as $excluded) {
            if (str_starts_with($path, $excluded)) {
                return true;
            }
        }

        // Skip GET requests to list/index endpoints (automatic data fetching)
        // These are background API calls, not intentional user actions
        if ($method === 'GET') {
            $skipPatterns = [
                'api/users$',              // GET /api/users (list all users)
                'api/users/stats',         // GET /api/users/stats
                'api/applications/counts', // GET /api/applications/counts
                'api/schools$',            // GET /api/schools (list all schools)
                'api/stats',               // Any stats endpoints
                'api/.*/stats',            // Stats for any resource
                'api/.*/counts',           // Counts for any resource
            ];

            foreach ($skipPatterns as $pattern) {
                if (preg_match('#' . $pattern . '#', $path)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if this is a duplicate request (same user, path, method within 5 seconds)
     */
    private function isDuplicateRequest(Request $request): bool
    {
        $user = $this->resolveUser($request);
        $userId = $user['id'] ?? 'guest';
        $method = $request->method();
        $path = $request->path();

        // Create a unique key for this request
        $requestKey = md5($userId . '_' . $method . '_' . $path);
        $cacheKey = 'audit_dedup_' . $requestKey;

        // Check if we've seen this exact request recently (within 5 seconds)
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            \Log::debug('AuditLog: Skipping duplicate request', [
                'user_id' => $userId,
                'method' => $method,
                'path' => $path
            ]);
            return true;
        }

        // Store this request signature for 5 seconds
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 5);

        return false;
    }

    /**
     * Log the request and response
     */
    private function logRequest(Request $request, Response $response, float $responseTime): void
    {
        try {
            $user = $this->resolveUser($request);
            $method = $request->method();
            $path = $request->path();
            $statusCode = $response->getStatusCode();

            // Determine action from request
            $action = $this->determineAction($request, $response);

            // Sanitize request body (remove passwords, tokens)
            $requestBody = $this->sanitizeData($request->all());

            // Determine resource type and ID
            $resourceType = $this->extractResourceType($path);
            $resourceId = $this->extractResourceId($path);

            // Generate description
            $description = $this->generateDescription($method, $path, $action, $resourceType, $resourceId);

            // Determine status
            $status = $statusCode >= 200 && $statusCode < 300 ? 'success' : 'failed';

            // Get error message if failed
            $errorMessage = null;
            if ($status === 'failed') {
                $responseContent = $response->getContent();
                $responseData = json_decode($responseContent, true);
                $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Request failed';
            }

            // Create audit log
            AuditLog::create([
                'user_id' => $user['id'] ?? null,
                'user_email' => $user['email'] ?? 'System',
                'user_role' => $user['role'] ?? null,
                'action' => $action,
                'description' => $description,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'request_method' => $method,
                'request_url' => $request->fullUrl(),
                'request_body' => $requestBody,
                'request_params' => $request->query(),
                'response_status' => $statusCode,
                'response_time_ms' => round($responseTime),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => session()->getId(),
                'status' => $status,
                'error_message' => $errorMessage,
                'metadata' => [
                    'referer' => $request->header('referer'),
                    'accept_language' => $request->header('accept-language'),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create audit log in middleware', [
                'error' => $e->getMessage(),
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
        }
    }

    /**
     * Determine action from request
     */
    private function determineAction(Request $request, Response $response): string
    {
        $method = $request->method();
        $path = $request->path();

        // Special cases based on path
        if (str_contains($path, 'login'))
            return 'LOGIN';
        if (str_contains($path, 'logout'))
            return 'LOGOUT';
        if (str_contains($path, 'export'))
            return 'EXPORT';
        if (str_contains($path, 'import'))
            return 'IMPORT';
        if (str_contains($path, 'download'))
            return 'FILE_DOWNLOAD';
        if (str_contains($path, 'upload'))
            return 'FILE_UPLOAD';
        if (str_contains($path, 'restore'))
            return 'RESTORE';
        if (str_contains($path, 'archive'))
            return 'ARCHIVE';
        if (str_contains($path, 'approve'))
            return 'APPROVE';
        if (str_contains($path, 'reject'))
            return 'REJECT';
        if (str_contains($path, 'submit'))
            return 'SUBMIT';

        // Map HTTP methods to actions
        $actionMap = [
            'GET' => 'VIEW',
            'POST' => 'CREATE',
            'PUT' => 'UPDATE',
            'PATCH' => 'UPDATE',
            'DELETE' => 'DELETE',
        ];

        return $actionMap[$method] ?? 'UNKNOWN';
    }

    /**
     * Sanitize request data to remove sensitive information
     */
    private function sanitizeData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'token',
            'secret',
            'api_key',
            'private_key',
            'credit_card',
            'cvv',
            'ssn'
        ];

        foreach ($data as $key => $value) {
            // Check if key contains sensitive terms
            foreach ($sensitiveKeys as $sensitive) {
                if (str_contains(strtolower($key), $sensitive)) {
                    $data[$key] = '[REDACTED]';
                    continue 2;
                }
            }

            // Recursively sanitize nested arrays
            if (is_array($value)) {
                $data[$key] = $this->sanitizeData($value);
            }
        }

        return $data;
    }

    /**
     * Extract resource type from path
     */
    private function extractResourceType(string $path): ?string
    {
        $pathParts = explode('/', trim($path, '/'));

        // Skip 'api' prefix if present
        if ($pathParts[0] === 'api' && count($pathParts) > 1) {
            $resource = $pathParts[1];
        } else {
            $resource = $pathParts[0] ?? null;
        }

        if (!$resource) {
            return null;
        }

        // Convert plural to singular and capitalize
        // applications -> Application, students -> Student
        return ucfirst(rtrim($resource, 's'));
    }

    /**
     * Extract resource ID from path
     */
    private function extractResourceId(string $path): ?string
    {
        $pathParts = explode('/', trim($path, '/'));

        // Look for numeric ID in path segments
        foreach ($pathParts as $part) {
            if (is_numeric($part)) {
                return $part;
            }
        }

        return null;
    }

    /**
     * Generate description for the action
     */
    private function generateDescription(string $method, string $path, string $action, ?string $resourceType, ?string $resourceId): string
    {
        $actionVerbs = [
            'CREATE' => 'Created',
            'UPDATE' => 'Updated',
            'DELETE' => 'Deleted',
            'VIEW' => 'Viewed',
            'EXPORT' => 'Exported',
            'IMPORT' => 'Imported',
            'FILE_UPLOAD' => 'Uploaded',
            'FILE_DOWNLOAD' => 'Downloaded',
            'LOGIN' => 'Logged in',
            'LOGOUT' => 'Logged out',
            'APPROVE' => 'Approved',
            'REJECT' => 'Rejected',
            'SUBMIT' => 'Submitted',
            'RESTORE' => 'Restored',
            'ARCHIVE' => 'Archived',
        ];

        $verb = $actionVerbs[$action] ?? 'Accessed';
        $resource = $resourceType ?? 'resource';
        $id = $resourceId ? " #{$resourceId}" : '';

        return "{$verb} {$resource}{$id}";
    }

    /**
     * Resolve user from request
     */
    private function resolveUser(Request $request): ?array
    {
        // PRIORITY 1: Try from request attribute (set by AuthFromAuthService middleware)
        // This is the most reliable source as it's set by our auth middleware
        $requestUser = $request->get('auth_user');

        \Log::debug('AuditLog: Checking auth_user from request', [
            'has_auth_user' => $requestUser !== null,
            'is_array' => is_array($requestUser),
            'has_id' => is_array($requestUser) && isset($requestUser['id']),
            'auth_user_data' => $requestUser
        ]);

        if (is_array($requestUser) && isset($requestUser['id'])) {
            \Log::info('AuditLog: Using auth_user from request', [
                'user_id' => $requestUser['id'],
                'email' => $requestUser['email'] ?? 'unknown',
                'role' => $requestUser['role'] ?? 'unknown'
            ]);
            return [
                'id' => $requestUser['id'],
                'email' => $requestUser['email'] ?? null,
                'role' => $requestUser['role'] ?? null,
            ];
        }

        // PRIORITY 2: Try auth user (Laravel Auth)
        $authUser = Auth::user();
        if ($authUser) {
            \Log::debug('AuditLog: Using Laravel Auth user', [
                'user_id' => $authUser->id,
                'email' => $authUser->email
            ]);
            return [
                'id' => $authUser->id,
                'email' => $authUser->email,
                'role' => $authUser->role ?? null,
            ];
        }

        // PRIORITY 3: Try from headers (for microservice communication)
        $userId = $request->header('X-User-ID');
        $userEmail = $request->header('X-User-Email');
        $userRole = $request->header('X-User-Role');

        if ($userId || $userEmail) {
            \Log::debug('AuditLog: Using headers', [
                'user_id' => $userId,
                'email' => $userEmail,
                'role' => $userRole
            ]);
            return [
                'id' => $userId ? (int) $userId : null,
                'email' => $userEmail,
                'role' => $userRole,
            ];
        }

        // PRIORITY 4: Try from Bearer Token (for public routes that have a token)
        $token = $request->bearerToken();
        if ($token) {
            // Cache the user resolution for 60 seconds to avoid spamming Auth Service
            return \Illuminate\Support\Facades\Cache::remember('audit_user_' . sha1($token), 60, function () use ($token) {
                // Handle test tokens (mirroring AuthFromAuthService logic)
                if ($token === 'test-token' || $token === 'valid-token') {
                    \Log::debug('AuditLog: Using test token fallback');
                    return [
                        'id' => 1,
                        'email' => 'admin@caloocan.gov.ph',
                        'role' => 'admin'  // Super admin role
                    ];
                }

                try {
                    $authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');

                    $response = \Illuminate\Support\Facades\Http::timeout(2)
                        ->withHeaders([
                            'Authorization' => 'Bearer ' . $token,
                            'Accept' => 'application/json'
                        ])
                        ->get("{$authServiceUrl}/api/user");

                    if ($response->successful()) {
                        $userData = $response->json();
                        if (isset($userData['success']) && $userData['success'] && isset($userData['data']['user'])) {
                            $user = $userData['data']['user'];
                            \Log::debug('AuditLog: Resolved user from Auth Service', [
                                'user_id' => $user['id'] ?? null,
                                'email' => $user['email'] ?? null
                            ]);
                            return [
                                'id' => $user['id'] ?? null,
                                'email' => $user['email'] ?? null,
                                'role' => $user['role'] ?? null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('AuditLog: Failed to resolve user from Auth Service', [
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }

                return null;
            });
        }

        \Log::debug('AuditLog: No user found, logging as System');
        return null;
    }
}
