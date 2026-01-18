<?php

namespace App\Services;

use App\Models\SecuritySetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SecuritySettingsService
{
    /**
     * Cache key for security settings
     */
    const CACHE_KEY = 'auth_security_settings';
    const CACHE_TTL = 3600; // 1 hour

    /**
     * Get all security settings as key-value pairs
     *
     * @return array
     */
    public function getSettings()
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $settings = SecuritySetting::all();

            $formatted = [];
            foreach ($settings as $setting) {
                // Convert value to appropriate type
                $value = $setting->setting_value;
                if (is_numeric($value)) {
                    $value = (int) $value;
                }
                $formatted[$setting->setting_key] = $value;
            }

            // Ensure defaults exist for missing keys
            $defaults = [
                'login_warning_threshold' => 5,
                'login_lockout_threshold' => 7,
                'login_lockout_duration' => 120, // 2 minutes
                'login_attempt_window' => 900, // 15 minutes
                'session_timeout_duration' => 1800, // 30 minutes
            ];

            return array_merge($defaults, $formatted);
        });
    }

    /**
     * Update security settings
     *
     * @param array $data Assumes keys match setting_key
     * @param string|null $userId ID of user making the change
     * @return array Updated settings
     */
    public function updateSettings(array $data, ?string $userId = null)
    {
        $allowedKeys = [
            'login_warning_threshold',
            'login_lockout_threshold',
            'login_lockout_duration',
            'login_attempt_window',
            'session_timeout_duration'
        ];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedKeys)) {
                SecuritySetting::updateOrCreate(
                    ['setting_key' => $key],
                    [
                        'setting_value' => (string) $value,
                        'updated_by' => $userId
                    ]
                );
            }
        }

        // Clear cache
        Cache::forget(self::CACHE_KEY);

        // Log the update
        Log::info('Security settings updated', ['user_id' => $userId, 'settings' => $data]);

        return $this->getSettings();
    }

    /**
     * Get a specific setting value
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function getSetting(string $key, $default = null)
    {
        $settings = $this->getSettings();
        return $settings[$key] ?? $default;
    }
}
