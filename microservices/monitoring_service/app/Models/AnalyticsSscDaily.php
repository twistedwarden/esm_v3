<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsSscDaily extends Model
{
    protected $table = 'analytics_ssc_daily';

    protected $fillable = [
        'snapshot_date',
        'doc_verification_pending',
        'financial_review_pending',
        'academic_review_pending',
        'final_approval_pending',
        'doc_verification_completed',
        'financial_review_completed',
        'academic_review_completed',
        'final_approval_completed',
        'total_approved',
        'total_rejected',
        'total_needs_revision',
        'avg_review_time_hours',
        'reviews_completed_today',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'avg_review_time_hours' => 'decimal:2',
    ];

    /**
     * Get total pending reviews across all stages
     */
    public function getTotalPendingAttribute(): int
    {
        return $this->doc_verification_pending 
            + $this->financial_review_pending 
            + $this->academic_review_pending 
            + $this->final_approval_pending;
    }

    /**
     * Get total completed reviews across all stages
     */
    public function getTotalCompletedAttribute(): int
    {
        return $this->doc_verification_completed 
            + $this->financial_review_completed 
            + $this->academic_review_completed 
            + $this->final_approval_completed;
    }

    /**
     * Get the bottleneck stage (stage with most pending)
     */
    public function getBottleneckStageAttribute(): string
    {
        $stages = [
            'document_verification' => $this->doc_verification_pending,
            'financial_review' => $this->financial_review_pending,
            'academic_review' => $this->academic_review_pending,
            'final_approval' => $this->final_approval_pending,
        ];

        return array_search(max($stages), $stages);
    }
}
