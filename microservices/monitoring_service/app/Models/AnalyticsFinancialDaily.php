<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsFinancialDaily extends Model
{
    protected $table = 'analytics_financial_daily';

    protected $fillable = [
        'snapshot_date',
        'school_year',
        'total_budget',
        'allocated_budget',
        'disbursed_budget',
        'remaining_budget',
        'disbursements_count',
        'disbursements_amount',
        'avg_disbursement_amount',
        'gcash_amount',
        'paymaya_amount',
        'bank_amount',
        'cash_amount',
        'other_amount',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'total_budget' => 'decimal:2',
        'allocated_budget' => 'decimal:2',
        'disbursed_budget' => 'decimal:2',
        'remaining_budget' => 'decimal:2',
        'disbursements_amount' => 'decimal:2',
        'avg_disbursement_amount' => 'decimal:2',
        'gcash_amount' => 'decimal:2',
        'paymaya_amount' => 'decimal:2',
        'bank_amount' => 'decimal:2',
        'cash_amount' => 'decimal:2',
        'other_amount' => 'decimal:2',
    ];

    /**
     * Get budget utilization rate as percentage
     */
    public function getUtilizationRateAttribute(): float
    {
        return $this->total_budget > 0 
            ? round(($this->disbursed_budget / $this->total_budget) * 100, 1) 
            : 0;
    }

    /**
     * Get allocation rate as percentage
     */
    public function getAllocationRateAttribute(): float
    {
        return $this->total_budget > 0 
            ? round(($this->allocated_budget / $this->total_budget) * 100, 1) 
            : 0;
    }
}
