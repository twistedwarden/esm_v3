<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AuditLogController extends Controller
{
    /**
     * Get all audit logs with filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AuditLog::query();

            // Apply filters
            if ($request->has('action') && $request->action) {
                $query->where('action', $request->action);
            }

            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('user_role') && $request->user_role) {
                $query->where('user_role', $request->user_role);
            }

            if ($request->has('resource_type') && $request->resource_type) {
                $query->where('resource_type', $request->resource_type);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('user_email', 'like', "%{$search}%")
                      ->orWhere('resource_type', 'like', "%{$search}%")
                      ->orWhere('action', 'like', "%{$search}%");
                });
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Apply pagination
            $perPage = $request->get('per_page', 25);
            $logs = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                    'from' => $logs->firstItem(),
                    'to' => $logs->lastItem(),
                ],
                'message' => 'Audit logs retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit log by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $log = AuditLog::find($id);

            if (!$log) {
                return response()->json([
                    'success' => false,
                    'message' => 'Audit log not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $log,
                'message' => 'Audit log retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit log statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $stats = AuditLog::getStatistics($days);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Audit statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent audit logs
     */
    public function recent(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $logs = AuditLog::getRecent($limit);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'message' => 'Recent audit logs retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recent audit logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit logs by user
     */
    public function byUser(Request $request, string $userId): JsonResponse
    {
        try {
            $limit = $request->get('limit', 50);
            $logs = AuditLog::getByUser($userId, $limit);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'message' => 'User audit logs retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user audit logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit logs by resource
     */
    public function byResource(Request $request, string $resourceType, string $resourceId): JsonResponse
    {
        try {
            $limit = $request->get('limit', 50);
            $logs = AuditLog::getByResource($resourceType, $resourceId, $limit);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'message' => 'Resource audit logs retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve resource audit logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available filter options
     */
    public function filterOptions(): JsonResponse
    {
        try {
            $options = [
                'actions' => AuditLog::distinct()->pluck('action')->filter()->values(),
                'user_roles' => AuditLog::distinct()->pluck('user_role')->filter()->values(),
                'resource_types' => AuditLog::distinct()->pluck('resource_type')->filter()->values(),
                'statuses' => AuditLog::distinct()->pluck('status')->filter()->values(),
            ];

            return response()->json([
                'success' => true,
                'data' => $options,
                'message' => 'Filter options retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve filter options: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export audit logs
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $query = AuditLog::query();

            // Apply same filters as index method
            if ($request->has('action') && $request->action) {
                $query->where('action', $request->action);
            }

            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('user_role') && $request->user_role) {
                $query->where('user_role', $request->user_role);
            }

            if ($request->has('resource_type') && $request->resource_type) {
                $query->where('resource_type', $request->resource_type);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $logs = $query->orderBy('created_at', 'desc')->get();

            // Log the export action
            $this->logAuditEvent([
                'action' => 'EXPORT',
                'resource_type' => 'AuditLog',
                'description' => 'Exported audit logs',
                'metadata' => [
                    'filters' => $request->all(),
                    'exported_count' => $logs->count(),
                ]
            ]);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'message' => 'Audit logs exported successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export audit logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to log audit events
     */
    private function logAuditEvent(array $data): void
    {
        try {
            AuditLog::create(array_merge([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email ?? null,
                'user_role' => auth()->user()->role ?? null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'session_id' => session()->getId(),
                'created_at' => now(),
            ], $data));
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            \Log::error('Failed to create audit log', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
        }
    }
}
