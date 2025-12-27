<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SscDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'decision',
        'approved_amount',
        'notes',
        'rejection_reason',
        'decided_by',
        'decided_at',
        'review_stage',
        'all_reviews_data',
    ];

    protected $casts = [
        'approved_amount' => 'decimal:2',
        'decided_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'all_reviews_data' => 'array',
    ];

    /**
     * Get the application that owns the decision
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }
}

