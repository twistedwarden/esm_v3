<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_email',
        'user_role',
        'action',
        'resource_type',
        'resource_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'session_id',
        'status',
        'error_message',
        'metadata',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope for filtering by action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope for filtering by user
     */
    public function scopeUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for filtering by resource type
     */
    public function scopeResourceType($query, $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    /**
     * Scope for filtering by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get formatted created date
     */
    public function getFormattedDateAttribute()
    {
        return $this->created_at->format('M d, Y H:i:s');
    }

    /**
     * Get action badge color
     */
    public function getActionBadgeColorAttribute()
    {
        return match($this->action) {
            'CREATE' => 'bg-green-100 text-green-800',
            'UPDATE' => 'bg-blue-100 text-blue-800',
            'DELETE' => 'bg-red-100 text-red-800',
            'LOGIN' => 'bg-purple-100 text-purple-800',
            'LOGOUT' => 'bg-gray-100 text-gray-800',
            'VIEW' => 'bg-yellow-100 text-yellow-800',
            'EXPORT' => 'bg-indigo-100 text-indigo-800',
            'IMPORT' => 'bg-pink-100 text-pink-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'success' => 'bg-green-100 text-green-800',
            'failed' => 'bg-red-100 text-red-800',
            'error' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Get user display name
     */
    public function getUserDisplayNameAttribute()
    {
        if ($this->user_email) {
            return $this->user_email;
        }
        return $this->user_id ? "User {$this->user_id}" : 'System';
    }

    /**
     * Get resource display name
     */
    public function getResourceDisplayNameAttribute()
    {
        if ($this->resource_type && $this->resource_id) {
            return "{$this->resource_type} #{$this->resource_id}";
        }
        return $this->resource_type ?? 'Unknown';
    }

    /**
     * Get recent audit logs
     */
    public static function getRecent($limit = 50)
    {
        return self::with([])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit logs by user
     */
    public static function getByUser($userId, $limit = 50)
    {
        return self::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit logs by resource
     */
    public static function getByResource($resourceType, $resourceId, $limit = 50)
    {
        return self::where('resource_type', $resourceType)
            ->where('resource_id', $resourceId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit statistics
     */
    public static function getStatistics($days = 30)
    {
        $startDate = Carbon::now()->subDays($days);
        
        return [
            'total_logs' => self::where('created_at', '>=', $startDate)->count(),
            'by_action' => self::where('created_at', '>=', $startDate)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action'),
            'by_status' => self::where('created_at', '>=', $startDate)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_user_role' => self::where('created_at', '>=', $startDate)
                ->selectRaw('user_role, COUNT(*) as count')
                ->groupBy('user_role')
                ->pluck('count', 'user_role'),
            'recent_activity' => self::where('created_at', '>=', $startDate)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }
}
