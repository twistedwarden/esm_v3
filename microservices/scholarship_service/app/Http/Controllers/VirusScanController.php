<?php

namespace App\Http\Controllers;

use App\Models\FileSecurityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VirusScanController extends Controller
{
    /**
     * Get file security statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $startDate = now()->subDays($days);
            
            // Basic statistics using FileSecurityLog model
            $totalScans = FileSecurityLog::where('created_at', '>=', $startDate)->count();
            $cleanScans = FileSecurityLog::where('created_at', '>=', $startDate)->clean()->count();
            $infectedScans = FileSecurityLog::where('created_at', '>=', $startDate)->infected()->count();
            $avgScanTime = FileSecurityLog::where('created_at', '>=', $startDate)
                ->whereNotNull('scan_duration')
                ->avg('scan_duration');
                
            // Threat breakdown
            $threatBreakdown = FileSecurityLog::where('created_at', '>=', $startDate)
                ->infected()
                ->whereNotNull('threat_name')
                ->select('threat_name', DB::raw('count(*) as count'))
                ->groupBy('threat_name')
                ->orderBy('count', 'desc')
                ->get();
                
            // Daily scan counts
            $dailyScans = FileSecurityLog::where('created_at', '>=', $startDate)
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('count(*) as total'),
                    DB::raw('sum(case when is_clean = 1 then 1 else 0 end) as clean'),
                    DB::raw('sum(case when is_clean = 0 then 1 else 0 end) as infected')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get();
                
            // Scanner health
            $recentScans = FileSecurityLog::where('created_at', '>=', now()->subHours(24))->count();
            $failedScans = FileSecurityLog::where('created_at', '>=', now()->subHours(24))
                ->where('scan_duration', '>', 30) // Consider >30s as failed
                ->count();
                
            $scannerHealth = $recentScans > 0 ? (($recentScans - $failedScans) / $recentScans) * 100 : 100;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'days' => $days,
                        'start_date' => $startDate->toDateString(),
                        'end_date' => now()->toDateString()
                    ],
                    'overview' => [
                        'total_scans' => $totalScans,
                        'clean_scans' => $cleanScans,
                        'infected_scans' => $infectedScans,
                        'clean_percentage' => $totalScans > 0 ? round(($cleanScans / $totalScans) * 100, 2) : 0,
                        'avg_scan_time' => round($avgScanTime ?? 0, 3)
                    ],
                    'threat_breakdown' => $threatBreakdown,
                    'daily_trends' => $dailyScans,
                    'scanner_health' => [
                        'status' => $scannerHealth > 90 ? 'healthy' : ($scannerHealth > 70 ? 'warning' : 'critical'),
                        'uptime_percentage' => round($scannerHealth, 2),
                        'recent_scans' => $recentScans,
                        'failed_scans' => $failedScans
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get virus scan statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get file security logs
     */
    public function logs(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $status = $request->get('status'); // 'clean', 'infected', 'all'
            $threat = $request->get('threat');
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            
            $query = FileSecurityLog::with(['student', 'application', 'document'])
                ->select('file_security_logs.*');
                
            if ($status && $status !== 'all') {
                if ($status === 'clean') {
                    $query->clean();
                } else {
                    $query->infected();
                }
            }
            
            if ($threat) {
                $query->threat($threat);
            }
            
            if ($dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            }
            
            if ($dateTo) {
                $query->where('created_at', '<=', $dateTo);
            }
            
            $logs = $query->orderBy('file_security_logs.created_at', 'desc')
                ->paginate($perPage);
                
            return response()->json([
                'success' => true,
                'data' => $logs
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get virus scan logs', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get rejected files list (quarantine equivalent)
     */
    public function quarantineList(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $threat = $request->get('threat');
            
            // Get rejected files (infected files that were blocked)
            $query = FileSecurityLog::with(['student', 'application'])
                ->infected()
                ->select('file_security_logs.*');
                
            if ($threat) {
                $query->threat($threat);
            }
            
            $rejected = $query->orderBy('file_security_logs.created_at', 'desc')
                ->paginate($perPage);
                
            return response()->json([
                'success' => true,
                'data' => $rejected
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get rejected files', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get quarantined files',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Review a quarantined file
     */
    public function reviewQuarantinedFile(Request $request, $quarantineId): JsonResponse
    {
        try {
            $request->validate([
                'action' => 'required|in:false_positive,confirmed_threat,restore,delete',
                'notes' => 'nullable|string|max:1000'
            ]);
            
            $quarantine = DB::table('document_quarantine')->find($quarantineId);
            if (!$quarantine) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quarantined file not found'
                ], 404);
            }
            
            $reviewerId = auth()->id();
            $action = $request->input('action');
            $notes = $request->input('notes');
            
            DB::table('document_quarantine')
                ->where('id', $quarantineId)
                ->update([
                    'is_reviewed' => true,
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'review_notes' => $notes,
                    'action_taken' => $action,
                    'updated_at' => now()
                ]);
                
            // Handle specific actions
            if ($action === 'false_positive') {
                // Restore the document
                $this->restoreQuarantinedFile($quarantineId);
            } elseif ($action === 'delete') {
                // Permanently delete the quarantined file
                $this->deleteQuarantinedFile($quarantineId);
            }
            
            Log::info('Quarantined file reviewed', [
                'quarantine_id' => $quarantineId,
                'action' => $action,
                'reviewer_id' => $reviewerId
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'File review completed successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to review quarantined file', [
                'quarantine_id' => $quarantineId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to review file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete a quarantined file
     */
    public function deleteQuarantinedFile($quarantineId): JsonResponse
    {
        try {
            $quarantine = DB::table('document_quarantine')->find($quarantineId);
            if (!$quarantine) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quarantined file not found'
                ], 404);
            }
            
            // Delete the physical file
            $filePath = storage_path('app/public/' . $quarantine->quarantine_file_path);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            
            // Delete the quarantine record
            DB::table('document_quarantine')->where('id', $quarantineId)->delete();
            
            Log::info('Quarantined file deleted', [
                'quarantine_id' => $quarantineId,
                'file_path' => $quarantine->quarantine_file_path
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Quarantined file deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to delete quarantined file', [
                'quarantine_id' => $quarantineId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Restore a quarantined file (internal method)
     */
    protected function restoreQuarantinedFile($quarantineId): void
    {
        try {
            $quarantine = DB::table('document_quarantine')->find($quarantineId);
            if (!$quarantine) return;
            
            $quarantinePath = storage_path('app/public/' . $quarantine->quarantine_file_path);
            $originalPath = storage_path('app/public/' . $quarantine->original_file_path);
            
            if (file_exists($quarantinePath)) {
                // Ensure original directory exists
                $originalDir = dirname($originalPath);
                if (!is_dir($originalDir)) {
                    mkdir($originalDir, 0755, true);
                }
                
                // Move file back to original location
                rename($quarantinePath, $originalPath);
                
                // Update document status
                DB::table('documents')
                    ->where('id', $quarantine->document_id)
                    ->update([
                        'status' => 'pending',
                        'verification_notes' => 'Restored from quarantine - false positive',
                        'updated_at' => now()
                    ]);
                
                Log::info('Quarantined file restored', [
                    'quarantine_id' => $quarantineId,
                    'document_id' => $quarantine->document_id
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to restore quarantined file', [
                'quarantine_id' => $quarantineId,
                'error' => $e->getMessage()
            ]);
        }
    }
}