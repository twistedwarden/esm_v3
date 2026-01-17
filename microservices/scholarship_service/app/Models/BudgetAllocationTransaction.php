<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetAllocationTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_id',
        'transaction_type',
        'amount',
        'balance_before',
        'balance_after',
        'reference_type',
        'reference_id',
        'notes',
        'performed_by_user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public $timestamps = false; // Only created_at

    /**
     * Boot method to set created_at automatically
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    /**
     * Get the budget this transaction belongs to
     */
    public function budget(): BelongsTo
    {
        return $this->belongsTo(PartnerSchoolBudget::class, 'budget_id');
    }

    /**
     * Get the user who performed this transaction
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    /**
     * Get the polymorphic reference (e.g., ScholarshipApplication, FundDisbursement)
     */
    public function reference()
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        $modelClass = "App\\Models\\{$this->reference_type}";

        if (class_exists($modelClass)) {
            return $modelClass::find($this->reference_id);
        }

        return null;
    }

    /**
     * Scope to filter by transaction type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('transaction_type', $type);
    }

    /**
     * Scope to filter by budget
     */
    public function scopeByBudget($query, int $budgetId)
    {
        return $query->where('budget_id', $budgetId);
    }
}
