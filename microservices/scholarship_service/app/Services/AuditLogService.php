<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AuditLogService
{
    /**
     * Log a user action
     */
    public static function logAction(
        string $action,
        string $description,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?string $status = 'success'
    ): void {
        try {
            $request = request();
            $userData = self::resolveUserData();

            AuditLog::create([
                'user_id' => $userData['id'] ?? null,
                'user_email' => $userData['email'] ?? null,
                'user_role' => $userData['role'] ?? null,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'description' => $description,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'session_id' => session()->getId(),
                'status' => $status,
                'metadata' => $metadata,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create audit log from scholarship_service', [
                'error' => $e->getMessage(),
                'action' => $action,
                'description' => $description,
            ]);
        }
    }

    /**
     * Log user creation
     */
    public static function logUserCreation(array $userData): void
    {
        self::logAction(
            'CREATE',
            'Created new user: ' . ($userData['email'] ?? 'Unknown'),
            'User',
            $userData['id'] ?? null,
            null,
            $userData,
            ['created_via' => 'admin_panel']
        );
    }

    /**
     * Log user update
     */
    public static function logUserUpdate(array $oldData, array $newData): void
    {
        self::logAction(
            'UPDATE',
            'Updated user: ' . ($newData['email'] ?? 'Unknown'),
            'User',
            $newData['id'] ?? null,
            $oldData,
            $newData,
            ['updated_via' => 'admin_panel']
        );
    }

    /**
     * Log user deletion/deactivation
     */
    public static function logUserDeletion(array $userData): void
    {
        self::logAction(
            'DELETE',
            'Deactivated user: ' . ($userData['email'] ?? 'Unknown'),
            'User',
            $userData['id'] ?? null,
            $userData,
            null,
            ['deactivated_via' => 'admin_panel']
        );
    }

    /**
     * Log user login
     */
    public static function logUserLogin(array $userData): void
    {
        self::logAction(
            'LOGIN',
            'User logged in: ' . ($userData['email'] ?? 'Unknown'),
            'User',
            $userData['id'] ?? null,
            null,
            $userData,
            ['login_method' => 'web']
        );
    }

    /**
     * Log user logout
     */
    public static function logUserLogout(array $userData): void
    {
        self::logAction(
            'LOGOUT',
            'User logged out: ' . ($userData['email'] ?? 'Unknown'),
            'User',
            $userData['id'] ?? null,
            $userData,
            null,
            ['logout_method' => 'web']
        );
    }

    /**
     * Log data export
     */
    public static function logDataExport(string $dataType, int $recordCount, ?array $filters = null): void
    {
        self::logAction(
            'EXPORT',
            "Exported {$recordCount} {$dataType} records",
            $dataType,
            null,
            null,
            null,
            [
                'export_type' => $dataType,
                'record_count' => $recordCount,
                'filters' => $filters,
                'exported_via' => 'admin_panel'
            ]
        );
    }

    /**
     * Log data import
     */
    public static function logDataImport(string $dataType, int $recordCount, ?array $metadata = null): void
    {
        self::logAction(
            'IMPORT',
            "Imported {$recordCount} {$dataType} records",
            $dataType,
            null,
            null,
            null,
            array_merge([
                'import_type' => $dataType,
                'record_count' => $recordCount,
                'imported_via' => 'admin_panel'
            ], $metadata ?? [])
        );
    }

    /**
     * Log system event
     */
    public static function logSystemEvent(string $event, string $description, ?array $metadata = null): void
    {
        self::logAction(
            'SYSTEM',
            $description,
            'System',
            null,
            null,
            null,
            array_merge(['event' => $event], $metadata ?? [])
        );
    }

    /**
     * Log failed action
     */
    public static function logFailedAction(
        string $action,
        string $description,
        string $errorMessage,
        ?string $resourceType = null,
        ?string $resourceId = null
    ): void {
        self::logAction(
            $action,
            $description,
            $resourceType,
            $resourceId,
            null,
            null,
            ['error' => $errorMessage],
            'failed'
        );
    }

    /**
     * Log view action
     */
    public static function logView(string $resourceType, ?string $resourceId = null, ?string $description = null): void
    {
        self::logAction(
            'VIEW',
            $description ?? "Viewed {$resourceType}" . ($resourceId ? " #{$resourceId}" : ''),
            $resourceType,
            $resourceId
        );
    }

    /**
     * Get audit trail for a specific resource
     */
    public static function getAuditTrail(string $resourceType, string $resourceId): array
    {
        return AuditLog::getByResource($resourceType, $resourceId)->toArray();
    }

    /**
     * Get user activity
     */
    public static function getUserActivity(string $userId): array
    {
        return AuditLog::getByUser($userId)->toArray();
    }

    protected static function resolveUserData(): ?array
    {
        $request = request();

        if (!$request) {
            return null;
        }

        $authUser = $request->get('auth_user');
        if (is_array($authUser)) {
            return [
                'id' => $authUser['id'] ?? null,
                'email' => $authUser['email'] ?? null,
                'role' => $authUser['role'] ?? null,
            ];
        }

        $headerUserId = $request->header('X-User-ID');
        $headerUserEmail = $request->header('X-User-Email');
        $headerUserRole = $request->header('X-User-Role');

        if ($headerUserId || $headerUserEmail || $headerUserRole) {
            return [
                'id' => $headerUserId ? (int) $headerUserId : null,
                'email' => $headerUserEmail ?: null,
                'role' => $headerUserRole ?: null,
            ];
        }

        $localUser = Auth::user();
        if ($localUser) {
            return [
                'id' => $localUser->id ?? null,
                'email' => $localUser->email ?? null,
                'role' => $localUser->role ?? null,
            ];
        }

        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        try {
            $authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
            ])->get($authServiceUrl . '/api/user');

            if (!$response->successful()) {
                Log::warning('Failed to fetch user from auth_service for audit log', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $json = $response->json();
            if (!is_array($json)) {
                return null;
            }

            $user = $json['data']['user'] ?? null;
            if (!is_array($user)) {
                return null;
            }

            return [
                'id' => $user['id'] ?? null,
                'email' => $user['email'] ?? null,
                'role' => $user['role'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Exception while resolving user from auth_service for audit log', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
