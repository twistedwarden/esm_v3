<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AuditLogService;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users and specific routes
        if (auth()->check() && $this->shouldLog($request)) {
            $this->logRequest($request, $response);
        }

        return $response;
    }

    /**
     * Determine if the request should be logged
     */
    private function shouldLog(Request $request): bool
    {
        $path = $request->path();
        
        // Log API routes that modify data
        $logRoutes = [
            'api/users',
            'api/staff',
            'api/applications',
            'api/students',
            'api/documents',
        ];

        foreach ($logRoutes as $route) {
            if (str_starts_with($path, $route)) {
                return in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']);
            }
        }

        return false;
    }

    /**
     * Log the request and response
     */
    private function logRequest(Request $request, Response $response): void
    {
        try {
            $method = $request->method();
            $path = $request->path();
            $statusCode = $response->getStatusCode();
            
            // Determine action based on HTTP method
            $action = match($method) {
                'POST' => 'CREATE',
                'PUT', 'PATCH' => 'UPDATE',
                'DELETE' => 'DELETE',
                default => 'VIEW'
            };

            // Determine resource type from path
            $resourceType = $this->getResourceTypeFromPath($path);
            $resourceId = $this->getResourceIdFromPath($path);

            // Create description
            $description = $this->createDescription($method, $path, $resourceType, $resourceId);

            // Determine status
            $status = $statusCode >= 200 && $statusCode < 300 ? 'success' : 'failed';

            // Get request data (excluding sensitive fields)
            $requestData = $this->sanitizeRequestData($request->all());

            // Log the action
            AuditLogService::logAction(
                $action,
                $description,
                $resourceType,
                $resourceId,
                null, // old values - not available in middleware
                $requestData,
                [
                    'http_method' => $method,
                    'path' => $path,
                    'status_code' => $statusCode,
                    'user_agent' => $request->userAgent(),
                    'ip_address' => $request->ip(),
                ],
                $status
            );
        } catch (\Exception $e) {
            \Log::error('Failed to log audit in middleware', [
                'error' => $e->getMessage(),
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
        }
    }

    /**
     * Get resource type from path
     */
    private function getResourceTypeFromPath(string $path): ?string
    {
        $pathParts = explode('/', $path);
        
        if (count($pathParts) >= 2) {
            $resource = $pathParts[1]; // api/users -> users
            return ucfirst(rtrim($resource, 's')); // users -> User
        }

        return null;
    }

    /**
     * Get resource ID from path
     */
    private function getResourceIdFromPath(string $path): ?string
    {
        $pathParts = explode('/', $path);
        
        // Look for numeric ID in path segments
        foreach ($pathParts as $part) {
            if (is_numeric($part)) {
                return $part;
            }
        }

        return null;
    }

    /**
     * Create description for the action
     */
    private function createDescription(string $method, string $path, ?string $resourceType, ?string $resourceId): string
    {
        $action = match($method) {
            'POST' => 'Created',
            'PUT', 'PATCH' => 'Updated',
            'DELETE' => 'Deleted',
            default => 'Accessed'
        };

        $resource = $resourceType ?? 'resource';
        $id = $resourceId ? " #{$resourceId}" : '';

        return "{$action} {$resource}{$id} via API";
    }

    /**
     * Sanitize request data to remove sensitive information
     */
    private function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'token',
            'secret',
            'api_key',
            'private_key',
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
