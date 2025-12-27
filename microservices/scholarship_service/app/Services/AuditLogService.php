<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            $user = Auth::user();
            $request = request();

            AuditLog::create([
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'user_role' => $user?->role,
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
            \Log::error('Failed to create audit log', [
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
}
