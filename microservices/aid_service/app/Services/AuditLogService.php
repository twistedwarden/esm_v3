<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

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
            Log::error('Failed to create audit log from aid_service', [
                'error' => $e->getMessage(),
                'action' => $action,
                'description' => $description,
            ]);
        }
    }

    public static function logDisbursementCreated(array $disbursementData, array $applicationData): void
    {
        self::logAction(
            'CREATE',
            'Created aid disbursement',
            'AidDisbursement',
            (string) ($disbursementData['id'] ?? ''),
            null,
            array_merge($disbursementData, [
                'application' => $applicationData,
            ])
        );
    }

    public static function logApplicationStatusUpdate(string $applicationId, string $oldStatus, string $newStatus): void
    {
        self::logAction(
            'UPDATE',
            "Updated application status from {$oldStatus} to {$newStatus}",
            'ScholarshipApplication',
            $applicationId,
            ['status' => $oldStatus],
            ['status' => $newStatus]
        );
    }

    public static function logGrantProcessingStarted(string $applicationId, float $amount): void
    {
        self::logAction(
            'UPDATE',
            'Started grant processing',
            'ScholarshipApplication',
            $applicationId,
            null,
            ['status' => 'grants_processing'],
            ['amount' => $amount]
        );
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
