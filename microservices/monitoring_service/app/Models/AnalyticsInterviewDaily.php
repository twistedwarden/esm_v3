<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsInterviewDaily extends Model
{
    protected $table = 'analytics_interview_daily';

    protected $fillable = [
        'snapshot_date',
        'scheduled_count',
        'completed_count',
        'cancelled_count',
        'no_show_count',
        'rescheduled_count',
        'passed_count',
        'failed_count',
        'needs_followup_count',
        'in_person_count',
        'online_count',
        'phone_count',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
    ];

    /**
     * Get pass rate as percentage
     */
    public function getPassRateAttribute(): float
    {
        $total = $this->passed_count + $this->failed_count;
        return $total > 0 ? round(($this->passed_count / $total) * 100, 1) : 0;
    }

    /**
     * Get no-show rate as percentage
     */
    public function getNoShowRateAttribute(): float
    {
        $total = $this->scheduled_count;
        return $total > 0 ? round(($this->no_show_count / $total) * 100, 1) : 0;
    }

    /**
     * Get completion rate as percentage
     */
    public function getCompletionRateAttribute(): float
    {
        return $this->scheduled_count > 0 
            ? round(($this->completed_count / $this->scheduled_count) * 100, 1) 
            : 0;
    }
}
