<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsAlert extends Model
{
    protected $table = 'analytics_alerts';

    protected $fillable = [
        'alert_type',
        'severity',
        'title',
        'message',
        'context',
        'is_acknowledged',
        'acknowledged_by',
        'acknowledged_at',
        'resolved_at',
    ];

    protected $casts = [
        'context' => 'array',
        'is_acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    /**
     * Scope for unacknowledged alerts
     */
    public function scopeUnacknowledged($query)
    {
        return $query->where('is_acknowledged', false);
    }

    /**
     * Scope for active alerts (not resolved)
     */
    public function scopeActive($query)
    {
        return $query->whereNull('resolved_at');
    }

    /**
     * Scope by severity
     */
    public function scopeBySeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Mark alert as acknowledged
     */
    public function acknowledge(int $userId): void
    {
        $this->update([
            'is_acknowledged' => true,
            'acknowledged_by' => $userId,
            'acknowledged_at' => now(),
        ]);
    }

    /**
     * Mark alert as resolved
     */
    public function resolve(): void
    {
        $this->update([
            'resolved_at' => now(),
        ]);
    }
}
