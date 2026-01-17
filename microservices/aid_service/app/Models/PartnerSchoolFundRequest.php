<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerSchoolFundRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_school_budget_id',
        'school_id',
        'amount',
        'purpose',
        'notes',
        'status',
        'request_document_path',
        'liquidation_document_path',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    /**
     * Get the budget this request belongs to
     */
    public function budget()
    {
        return $this->belongsTo(PartnerSchoolBudget::class, 'partner_school_budget_id');
    }

    /**
     * Check if request can be liquidated
     */
    public function canBeLiquidated(): bool
    {
        return $this->status === 'disbursed';
    }

    /**
     * Mark as liquidated
     */
    public function markAsLiquidated(string $documentPath): void
    {
        $this->update([
            'status' => 'liquidated',
            'liquidation_document_path' => $documentPath,
        ]);
    }
}
