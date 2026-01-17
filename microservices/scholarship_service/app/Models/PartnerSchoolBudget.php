<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerSchoolBudget extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'academic_year',
        'semester',
        'allocated_amount',
        'spent_amount',
        'reserved_amount',
        'allocation_date',
        'expiry_date',
        'status',
        'notes',
        'allocated_by_user_id',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'allocation_date' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    /**
     * Get the school this budget belongs to
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get all transactions for this budget
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(BudgetAllocationTransaction::class, 'budget_id');
    }

    /**
     * Get all disbursements from this budget
     */
    public function disbursements(): HasMany
    {
        return $this->hasMany(FundDisbursement::class, 'budget_id');
    }

    /**
     * Get all applications funded by this budget
     */
    public function applications(): HasMany
    {
        return $this->hasMany(ScholarshipApplication::class, 'budget_id');
    }

    /**
     * Get the user who allocated this budget
     */
    public function allocatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'allocated_by_user_id');
    }

    /**
     * Calculate available balance
     */
    public function getAvailableBalanceAttribute(): float
    {
        return (float) ($this->allocated_amount - $this->spent_amount - $this->reserved_amount);
    }

    /**
     * Reserve funds for an application
     */
    public function reserveFunds(float $amount, ScholarshipApplication $application, ?int $userId = null): BudgetAllocationTransaction
    {
        if ($this->available_balance < $amount) {
            throw new \Exception('Insufficient budget available');
        }

        $balanceBefore = $this->available_balance;

        $this->reserved_amount += $amount;
        $this->save();

        return $this->transactions()->create([
            'transaction_type' => 'reservation',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->available_balance,
            'reference_type' => 'ScholarshipApplication',
            'reference_id' => $application->id,
            'notes' => "Funds reserved for application #{$application->application_number}",
            'performed_by_user_id' => $userId,
        ]);
    }

    /**
     * Release reserved funds (e.g., when application is rejected)
     */
    public function releaseFunds(float $amount, ScholarshipApplication $application, ?int $userId = null): BudgetAllocationTransaction
    {
        $balanceBefore = $this->available_balance;

        $this->reserved_amount -= $amount;
        $this->save();

        return $this->transactions()->create([
            'transaction_type' => 'release',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->available_balance,
            'reference_type' => 'ScholarshipApplication',
            'reference_id' => $application->id,
            'notes' => "Reserved funds released for application #{$application->application_number}",
            'performed_by_user_id' => $userId,
        ]);
    }

    /**
     * Record a disbursement
     */
    public function recordDisbursement(float $amount, FundDisbursement $disbursement, ?int $userId = null): BudgetAllocationTransaction
    {
        $balanceBefore = $this->available_balance;

        // Move from reserved to spent
        $this->reserved_amount -= $amount;
        $this->spent_amount += $amount;

        // Check if budget is depleted
        if ($this->available_balance <= 0) {
            $this->status = 'depleted';
        }

        $this->save();

        return $this->transactions()->create([
            'transaction_type' => 'disbursement',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->available_balance,
            'reference_type' => 'FundDisbursement',
            'reference_id' => $disbursement->id,
            'notes' => "Disbursement processed",
            'performed_by_user_id' => $userId,
        ]);
    }

    /**
     * Adjust budget allocation (manual adjustment)
     */
    public function adjustAllocation(float $amount, string $reason, ?int $userId = null): BudgetAllocationTransaction
    {
        $balanceBefore = $this->available_balance;

        $this->allocated_amount += $amount;

        // Update status if needed
        if ($this->available_balance > 0 && $this->status === 'depleted') {
            $this->status = 'active';
        }

        $this->save();

        return $this->transactions()->create([
            'transaction_type' => 'adjustment',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->available_balance,
            'notes' => $reason,
            'performed_by_user_id' => $userId,
        ]);
    }

    /**
     * Scope to get active budgets
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get budgets by school
     */
    public function scopeBySchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Scope to get budgets by academic year
     */
    public function scopeByAcademicYear($query, string $academicYear)
    {
        return $query->where('academic_year', $academicYear);
    }

    /**
     * Check if budget has sufficient funds
     */
    public function hasSufficientFunds(float $amount): bool
    {
        return $this->available_balance >= $amount;
    }
}
