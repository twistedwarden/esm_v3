<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerSchoolBudget extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_budget_id',
        'school_id',
        'school_name',
        'academic_year',
        'allocated_amount',
        'disbursed_amount',
        'allocation_date',
        'expiry_date',
        'status',
        'notes',
        'allocated_by_user_id',
    ];

    protected $appends = ['available_amount'];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'disbursed_amount' => 'decimal:2',
        'allocation_date' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    /**
     * Get the main budget this partner budget is allocated from
     */
    public function sourceBudget()
    {
        return $this->belongsTo(\App\Models\BudgetAllocation::class, 'source_budget_id');
    }

    /**
     * Get available amount (computed attribute)
     */
    public function getAvailableAmountAttribute(): float
    {
        return (float) ($this->allocated_amount - $this->disbursed_amount);
    }

    /**
     * Check if budget has sufficient funds
     */
    public function hasFunds(float $amount): bool
    {
        return $this->available_amount >= $amount;
    }

    /**
     * Deduct amount from budget after disbursement
     */
    public function deduct(float $amount): void
    {
        \DB::transaction(function () use ($amount) {
            $this->disbursed_amount += $amount;

            // Auto-update status if depleted
            if ($this->available_amount <= 0) {
                $this->status = 'depleted';
            }

            $this->save();

            // Also update main budget's disbursed amount
            if ($this->sourceBudget) {
                $this->sourceBudget->disbursed_budget += $amount;
                $this->sourceBudget->save();
            }
        });
    }

    /**
     * Add amount back to budget (e.g., if disbursement fails/cancelled)
     */
    public function refund(float $amount): void
    {
        \DB::transaction(function () use ($amount) {
            $this->disbursed_amount -= $amount;

            // Reactivate if was depleted and now has funds
            if ($this->status === 'depleted' && $this->available_amount > 0) {
                $this->status = 'active';
            }

            $this->save();

            // Also refund to main budget
            if ($this->sourceBudget) {
                $this->sourceBudget->disbursed_budget -= $amount;
                $this->sourceBudget->save();
            }
        });
    }

    /**
     * Adjust allocated amount (increase or decrease)
     */
    public function adjustAllocation(float $newAmount, ?string $notes = null): void
    {
        $this->allocated_amount = $newAmount;

        if ($notes) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . $notes;
        }

        // Update status based on new allocation
        if ($this->available_amount > 0 && $this->status === 'depleted') {
            $this->status = 'active';
        } elseif ($this->available_amount <= 0) {
            $this->status = 'depleted';
        }

        $this->save();
    }

    /**
     * Scope: Active budgets only
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Filter by school
     */
    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Scope: Filter by academic year
     */
    public function scopeForYear($query, string $academicYear)
    {
        return $query->where('academic_year', $academicYear);
    }

    /**
     * Get current active budget for a school
     */
    public static function getCurrentBudget(int $schoolId): ?self
    {
        return self::where('school_id', $schoolId)
            ->where('status', 'active')
            ->orderBy('allocation_date', 'desc')
            ->first();
    }
}
