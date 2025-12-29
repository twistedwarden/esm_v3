<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuditLogService
{
    public static function logAction(
        string $action,
        string $description,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?string $status = 'success',
        ?int $userId = null,
        ?string $userEmail = null,
        ?string $userRole = null
    ): void {
        try {
            $request = request();

            $resolvedUser = self::resolveUserData($userId, $userEmail, $userRole);

            AuditLog::create([
                'user_id' => $resolvedUser['id'] ?? null,
                'user_email' => $resolvedUser['email'] ?? null,
                'user_role' => $resolvedUser['role'] ?? null,
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
            Log::error('Failed to create audit log from auth_service', [
                'error' => $e->getMessage(),
                'action' => $action,
                'description' => $description,
            ]);
        }
    }

    protected static function resolveUserData(?int $userId, ?string $userEmail, ?string $userRole): ?array
    {
        if ($userId || $userEmail || $userRole) {
            return [
                'id' => $userId,
                'email' => $userEmail,
                'role' => $userRole,
            ];
        }

        $authUser = Auth::user();
        if ($authUser) {
            return [
                'id' => $authUser->id ?? null,
                'email' => $authUser->email ?? null,
                'role' => $authUser->role ?? null,
            ];
        }

        return null;
    }
}

