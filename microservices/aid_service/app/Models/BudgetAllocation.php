<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BudgetAllocation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'budget_type',
        'school_year',
        'total_budget',
        'allocated_budget',
        'disbursed_budget',
        'description',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'total_budget' => 'decimal:2',
        'allocated_budget' => 'decimal:2',
        'disbursed_budget' => 'decimal:2',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get remaining budget (total - disbursed)
     */
    public function getRemainingBudgetAttribute(): float
    {
        return max(0, $this->total_budget - $this->disbursed_budget);
    }

    /**
     * Get available budget (total - allocated)
     */
    public function getAvailableBudgetAttribute(): float
    {
        return max(0, $this->total_budget - $this->allocated_budget);
    }

    /**
     * Increment disbursed budget
     */
    public function incrementDisbursed(float $amount): bool
    {
        $this->disbursed_budget += $amount;
        return $this->save();
    }

    /**
     * Decrement allocated budget (when application is approved)
     */
    public function incrementAllocated(float $amount): bool
    {
        $this->allocated_budget += $amount;
        return $this->save();
    }

    /**
     * Set total budget
     */
    public function setTotalBudget(float $amount): bool
    {
        $this->total_budget = $amount;
        return $this->save();
    }
}
