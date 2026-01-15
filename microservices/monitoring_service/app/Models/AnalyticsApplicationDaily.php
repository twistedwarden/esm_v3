<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsApplicationDaily extends Model
{
    protected $table = 'analytics_application_daily';

    protected $fillable = [
        'snapshot_date',
        'total_applications',
        'draft_count',
        'submitted_count',
        'reviewed_count',
        'approved_count',
        'rejected_count',
        'processing_count',
        'released_count',
        'on_hold_count',
        'cancelled_count',
        'new_applications',
        'renewal_applications',
        'merit_count',
        'need_based_count',
        'special_count',
        'avg_processing_days',
        'applications_submitted_today',
        'applications_approved_today',
        'applications_rejected_today',
        'total_requested_amount',
        'total_approved_amount',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'avg_processing_days' => 'decimal:2',
        'total_requested_amount' => 'decimal:2',
        'total_approved_amount' => 'decimal:2',
    ];

    /**
     * Get approval rate as percentage
     */
    public function getApprovalRateAttribute(): float
    {
        $total = $this->approved_count + $this->rejected_count;
        return $total > 0 ? round(($this->approved_count / $total) * 100, 1) : 0;
    }

    /**
     * Get pending count (submitted + reviewed)
     */
    public function getPendingCountAttribute(): int
    {
        return $this->submitted_count + $this->reviewed_count;
    }
}
