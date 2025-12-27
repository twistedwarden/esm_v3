<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get user notification preferences
     */
    public function getNotificationPreferences(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Get notification preferences from database
            $preferences = DB::table('user_notification_preferences')
                ->where('user_id', $user->id)
                ->first();
            
            if (!$preferences) {
                // Create default preferences
                $preferences = [
                    'email_notifications' => true,
                    'sms_notifications' => false,
                    'push_notifications' => true,
                    'application_updates' => true,
                    'system_alerts' => true,
                    'marketing_emails' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
                
                DB::table('user_notification_preferences')->insert([
                    'user_id' => $user->id,
                    ...$preferences
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'email_notifications' => $preferences->email_notifications ?? true,
                    'sms_notifications' => $preferences->sms_notifications ?? false,
                    'push_notifications' => $preferences->push_notifications ?? true,
                    'application_updates' => $preferences->application_updates ?? true,
                    'system_alerts' => $preferences->system_alerts ?? true,
                    'marketing_emails' => $preferences->marketing_emails ?? false,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notification preferences: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user notification preferences
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                'email_notifications' => 'boolean',
                'sms_notifications' => 'boolean',
                'push_notifications' => 'boolean',
                'application_updates' => 'boolean',
                'system_alerts' => 'boolean',
                'marketing_emails' => 'boolean',
            ]);
            
            // Update or create notification preferences
            DB::table('user_notification_preferences')
                ->updateOrInsert(
                    ['user_id' => $user->id],
                    array_merge($validated, [
                        'updated_at' => now()
                    ])
                );
            
            return response()->json([
                'success' => true,
                'message' => 'Notification preferences updated successfully',
                'data' => $validated
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification preferences: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system settings
     */
    public function getSystemSettings(Request $request): JsonResponse
    {
        try {
            $settings = DB::table('system_settings')->get()->keyBy('key');
            
            $defaultSettings = [
                'maintenance_mode' => false,
                'registration_enabled' => true,
                'email_verification_required' => true,
                'max_file_upload_size' => 10485760, // 10MB
                'session_timeout' => 120, // 2 hours
                'password_min_length' => 8,
                'require_strong_password' => true,
                'backup_frequency' => 'daily',
                'log_retention_days' => 90,
                'notification_batch_size' => 100,
            ];
            
            $result = [];
            foreach ($defaultSettings as $key => $defaultValue) {
                $result[$key] = $settings->get($key)?->value ?? $defaultValue;
            }
            
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve system settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update system settings
     */
    public function updateSystemSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'maintenance_mode' => 'boolean',
                'registration_enabled' => 'boolean',
                'email_verification_required' => 'boolean',
                'max_file_upload_size' => 'integer|min:1048576', // 1MB minimum
                'session_timeout' => 'integer|min:30|max:480', // 30 minutes to 8 hours
                'password_min_length' => 'integer|min:6|max:32',
                'require_strong_password' => 'boolean',
                'backup_frequency' => 'in:daily,weekly,monthly',
                'log_retention_days' => 'integer|min:7|max:365',
                'notification_batch_size' => 'integer|min:10|max:1000',
            ]);
            
            foreach ($validated as $key => $value) {
                DB::table('system_settings')
                    ->updateOrInsert(
                        ['key' => $key],
                        [
                            'value' => $value,
                            'updated_at' => now()
                        ]
                    );
            }
            
            return response()->json([
                'success' => true,
                'message' => 'System settings updated successfully',
                'data' => $validated
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update system settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get admin statistics
     */
    public function getAdminStats(Request $request): JsonResponse
    {
        try {
            // Get real statistics from database
            $stats = [
                'total_users' => DB::table('users')->count(),
                'active_sessions' => DB::table('personal_access_tokens')
                    ->where('expires_at', '>', now())
                    ->count(),
                'total_requests' => DB::table('audit_logs')
                    ->where('created_at', '>=', now()->subDay())
                    ->count(),
                'error_rate' => $this->calculateErrorRate(),
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve admin statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system health
     */
    public function getSystemHealth(Request $request): JsonResponse
    {
        try {
            $health = [
                'status' => 'healthy',
                'database' => $this->checkDatabaseHealth(),
                'cache' => $this->checkCacheHealth(),
                'storage' => $this->checkStorageHealth(),
                'uptime' => $this->getSystemUptime(),
                'last_backup' => $this->getLastBackupTime(),
                'memory_usage' => $this->getMemoryUsage(),
                'disk_usage' => $this->getDiskUsage(),
            ];
            
            return response()->json([
                'success' => true,
                'data' => $health
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve system health: ' . $e->getMessage()
            ], 500);
        }
    }

    private function calculateErrorRate(): string
    {
        try {
            $totalRequests = DB::table('audit_logs')
                ->where('created_at', '>=', now()->subDay())
                ->count();
            
            $errorRequests = DB::table('audit_logs')
                ->where('created_at', '>=', now()->subDay())
                ->where('action', 'LIKE', '%error%')
                ->count();
            
            if ($totalRequests === 0) return '0%';
            
            $rate = ($errorRequests / $totalRequests) * 100;
            return number_format($rate, 1) . '%';
        } catch (\Exception $e) {
            return '0%';
        }
    }

    private function checkDatabaseHealth(): string
    {
        try {
            DB::connection()->getPdo();
            return 'connected';
        } catch (\Exception $e) {
            return 'disconnected';
        }
    }

    private function checkCacheHealth(): string
    {
        try {
            // Simple cache test
            cache()->put('health_check', 'ok', 1);
            $result = cache()->get('health_check');
            return $result === 'ok' ? 'working' : 'not_working';
        } catch (\Exception $e) {
            return 'not_working';
        }
    }

    private function checkStorageHealth(): string
    {
        try {
            $testFile = storage_path('app/health_check.txt');
            file_put_contents($testFile, 'test');
            $result = file_get_contents($testFile);
            unlink($testFile);
            return $result === 'test' ? 'accessible' : 'not_accessible';
        } catch (\Exception $e) {
            return 'not_accessible';
        }
    }

    private function getSystemUptime(): string
    {
        try {
            $uptime = shell_exec('uptime -p 2>/dev/null') ?: 'Unknown';
            return trim($uptime);
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getLastBackupTime(): string
    {
        try {
            $backupPath = storage_path('app/backups');
            if (!is_dir($backupPath)) {
                return 'Never';
            }
            
            $files = glob($backupPath . '/*.sql');
            if (empty($files)) {
                return 'Never';
            }
            
            $latestFile = max($files);
            return date('Y-m-d H:i:s', filemtime($latestFile));
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getMemoryUsage(): array
    {
        try {
            $memory = memory_get_usage(true);
            $peakMemory = memory_get_peak_usage(true);
            
            return [
                'current' => $this->formatBytes($memory),
                'peak' => $this->formatBytes($peakMemory),
                'limit' => ini_get('memory_limit')
            ];
        } catch (\Exception $e) {
            return ['current' => 'Unknown', 'peak' => 'Unknown', 'limit' => 'Unknown'];
        }
    }

    private function getDiskUsage(): array
    {
        try {
            $totalSpace = disk_total_space(storage_path());
            $freeSpace = disk_free_space(storage_path());
            $usedSpace = $totalSpace - $freeSpace;
            
            return [
                'total' => $this->formatBytes($totalSpace),
                'used' => $this->formatBytes($usedSpace),
                'free' => $this->formatBytes($freeSpace),
                'percentage' => round(($usedSpace / $totalSpace) * 100, 2)
            ];
        } catch (\Exception $e) {
            return ['total' => 'Unknown', 'used' => 'Unknown', 'free' => 'Unknown', 'percentage' => 0];
        }
    }

    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
