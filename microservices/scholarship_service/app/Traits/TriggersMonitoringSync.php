<?php

namespace App\Traits;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * Trait for triggering real-time monitoring data sync
 * 
 * Use this trait in controllers that need to trigger immediate
 * monitoring updates when critical events occur.
 */
trait TriggersMonitoringSync
{
    /**
     * Trigger monitoring data sync asynchronously
     * 
     * This runs the monitoring:sync command in the background
     * to avoid blocking the current request.
     */
    protected function triggerMonitoringSync(): void
    {
        try {
            // Run sync command asynchronously (non-blocking)
            Artisan::queue('monitoring:sync');

            Log::info('Monitoring sync triggered by event', [
                'controller' => static::class,
                'triggered_at' => now()->toIso8601String()
            ]);
        } catch (\Exception $e) {
            // Don't fail the main request if monitoring sync fails
            Log::warning('Failed to trigger monitoring sync', [
                'error' => $e->getMessage(),
                'controller' => static::class
            ]);
        }
    }

    /**
     * Trigger monitoring data sync synchronously (blocking)
     * 
     * Use this only when you need to ensure sync completes
     * before continuing. This will block the request.
     */
    protected function triggerMonitoringSyncNow(): void
    {
        try {
            Artisan::call('monitoring:sync');

            Log::info('Monitoring sync completed synchronously', [
                'controller' => static::class,
                'completed_at' => now()->toIso8601String()
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to sync monitoring data', [
                'error' => $e->getMessage(),
                'controller' => static::class
            ]);
        }
    }
}
