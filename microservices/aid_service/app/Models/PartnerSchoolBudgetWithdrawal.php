<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerSchoolBudgetWithdrawal extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_school_budget_id',
        'school_id',
        'amount',
        'purpose',
        'notes',
        'proof_document_path',
        'withdrawal_date',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'withdrawal_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the budget this withdrawal belongs to
     */
    public function budget()
    {
        return $this->belongsTo(PartnerSchoolBudget::class, 'partner_school_budget_id');
    }

    /**
     * Get the formatted amount
     */
    public function getFormattedAmountAttribute(): string
    {
        return '₱' . number_format((float) $this->amount, 2);
    }

    /**
     * Scope to get withdrawals for a specific school
     */
    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Scope to get withdrawals within a date range
     */
    public function scopeWithinDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('withdrawal_date', [$startDate, $endDate]);
    }
}
