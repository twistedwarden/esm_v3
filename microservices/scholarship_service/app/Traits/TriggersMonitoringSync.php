<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Trait for triggering real-time monitoring data sync
 * 
 * Use this trait in controllers that need to trigger immediate
 * monitoring updates when critical events occur.
 */
trait TriggersMonitoringSync
{
    /**
     * Trigger monitoring data sync via HTTP
     * 
     * This sends the current application metrics directly to the
     * monitoring service for immediate dashboard updates.
     */
    protected function triggerMonitoringSync(): void
    {
        try {
            $monitoringUrl = config('services.monitoring.url', 'http://localhost:8003');
            $snapshotDate = Carbon::today()->toDateString();

            // Small delay to ensure database transaction is fully committed
            usleep(500000); // 500ms delay

            // Aggregate current metrics
            $byStatus = DB::table('scholarship_applications')
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $byType = DB::table('scholarship_applications')
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();

            $total = array_sum($byStatus);

            $data = [
                'snapshot_date' => $snapshotDate,
                'applications' => [
                    'total' => $total,
                    'by_status' => [
                        'submitted' => ($byStatus['submitted'] ?? 0) + ($byStatus['pending'] ?? 0) + ($byStatus['documents_pending'] ?? 0),
                        'reviewed' => ($byStatus['documents_reviewed'] ?? 0) + ($byStatus['reviewed'] ?? 0) + ($byStatus['endorsed_to_ssc'] ?? 0),
                        'approved' => ($byStatus['approved'] ?? 0) + ($byStatus['grants_processing'] ?? 0) + ($byStatus['grants_disbursed'] ?? 0),
                        'rejected' => $byStatus['rejected'] ?? 0,
                        'processing' => $byStatus['grants_processing'] ?? 0,
                        'released' => $byStatus['grants_disbursed'] ?? 0,
                    ],
                    'by_type' => [
                        'new' => $byType['new'] ?? 0,
                        'renewal' => $byType['renewal'] ?? 0,
                    ],
                    'by_category' => [],
                ]
            ];

            // Send to monitoring service
            Http::timeout(10)->post("{$monitoringUrl}/api/internal/application-snapshot", $data);

            Log::info('Monitoring sync triggered via HTTP', [
                'controller' => static::class,
                'triggered_at' => now()->toIso8601String(),
                'total_applications' => $total
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
        $this->triggerMonitoringSync();
    }
}

