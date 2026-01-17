<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundDisbursement extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'budget_id',
        'amount',
        'disbursement_method',
        'reference_number',
        'disbursement_date',
        'processed_by_school',
        'processed_by_user_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'disbursement_date' => 'date',
        'processed_by_school' => 'boolean',
    ];

    /**
     * Get the application this disbursement is for
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    /**
     * Get the budget this disbursement is from (null for public schools)
     */
    public function budget(): BelongsTo
    {
        return $this->belongsTo(PartnerSchoolBudget::class, 'budget_id');
    }

    /**
     * Get the user who processed this disbursement
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    /**
     * Scope to get completed disbursements
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to get pending disbursements
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get disbursements by budget
     */
    public function scopeByBudget($query, int $budgetId)
    {
        return $query->where('budget_id', $budgetId);
    }

    /**
     * Mark disbursement as completed
     */
    public function markAsCompleted(string $referenceNumber = null): void
    {
        $this->status = 'completed';
        if ($referenceNumber) {
            $this->reference_number = $referenceNumber;
        }
        $this->save();
    }

    /**
     * Mark disbursement as failed
     */
    public function markAsFailed(string $reason = null): void
    {
        $this->status = 'failed';
        if ($reason) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Failed: " . $reason;
        }
        $this->save();
    }
}
