<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AuthServiceClient
{
    private string $baseUrl;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.auth_service.url', 'http://localhost:8001');
        $this->timeout = config('services.auth_service.timeout', 10);
    }

    /**
     * Get user by ID from auth service
     */
    public function getUserById(int $userId): ?array
    {
        $cacheKey = "auth_user_{$userId}";
        
        return Cache::remember($cacheKey, 300, function () use ($userId) {
            try {
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/api/users/{$userId}");

                if ($response->successful()) {
                    return $response->json('data');
                }

                Log::warning("Failed to fetch user {$userId} from auth service", [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return null;
            } catch (\Exception $e) {
                Log::error("Error fetching user {$userId} from auth service", [
                    'error' => $e->getMessage()
                ]);

                return null;
            }
        });
    }

    /**
     * Get multiple users by IDs
     */
    public function getUsersByIds(array $userIds): array
    {
        $users = [];
        $uncachedIds = [];

        // Check cache first
        foreach ($userIds as $userId) {
            $cacheKey = "auth_user_{$userId}";
            $cachedUser = Cache::get($cacheKey);
            
            if ($cachedUser) {
                $users[$userId] = $cachedUser;
            } else {
                $uncachedIds[] = $userId;
            }
        }

        // Fetch uncached users
        if (!empty($uncachedIds)) {
            try {
                $response = Http::timeout($this->timeout)
                    ->post("{$this->baseUrl}/api/users/batch", [
                        'user_ids' => $uncachedIds
                    ]);

                if ($response->successful()) {
                    $fetchedUsers = $response->json('data', []);
                    
                    foreach ($fetchedUsers as $user) {
                        $users[$user['id']] = $user;
                        // Cache for 5 minutes
                        Cache::put("auth_user_{$user['id']}", $user, 300);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Error fetching users batch from auth service", [
                    'user_ids' => $uncachedIds,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $users;
    }

    /**
     * Get all staff users (users with staff role)
     */
    public function getStaffUsers(): array
    {
        $cacheKey = 'auth_staff_users';
        
        return Cache::remember($cacheKey, 300, function () {
            try {
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/api/users/staff");

                if ($response->successful()) {
                    return $response->json('data', []);
                }

                Log::warning("Failed to fetch staff users from auth service", [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return [];
            } catch (\Exception $e) {
                Log::error("Error fetching staff users from auth service", [
                    'error' => $e->getMessage()
                ]);

                return [];
            }
        });
    }

    /**
     * Get user by email
     */
    public function getUserByEmail(string $email): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/api/users/email/{$email}");

            if ($response->successful()) {
                $user = $response->json('data');
                if ($user) {
                    // Cache the user
                    Cache::put("auth_user_{$user['id']}", $user, 300);
                }
                return $user;
            }

            return null;
        } catch (\Exception $e) {
            Log::error("Error fetching user by email from auth service", [
                'email' => $email,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Clear user cache
     */
    public function clearUserCache(int $userId): void
    {
        Cache::forget("auth_user_{$userId}");
    }

    /**
     * Clear all staff users cache
     */
    public function clearStaffCache(): void
    {
        Cache::forget('auth_staff_users');
    }
}
