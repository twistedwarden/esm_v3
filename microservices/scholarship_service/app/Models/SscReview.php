<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SscReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'review_stage',
        'reviewer_id',
        'reviewer_role',
        'status',
        'review_notes',
        'review_data',
        'reviewed_at'
    ];

    protected $casts = [
        'review_data' => 'array',
        'reviewed_at' => 'datetime',
    ];

    // Relationships
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    // Methods
    public function approve($notes = null, $data = null): bool
    {
        $this->update([
            'status' => 'approved',
            'review_notes' => $notes,
            'review_data' => $data,
            'reviewed_at' => now(),
        ]);

        return true;
    }

    public function reject($reason = null, $data = null): bool
    {
        $this->update([
            'status' => 'rejected',
            'review_notes' => $reason,
            'review_data' => $data,
            'reviewed_at' => now(),
        ]);

        return true;
    }

    public function requestRevision($notes = null): bool
    {
        $this->update([
            'status' => 'needs_revision',
            'review_notes' => $notes,
            'reviewed_at' => now(),
        ]);

        return true;
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function needsRevision(): bool
    {
        return $this->status === 'needs_revision';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    // Scopes
    public function scopeByStage($query, $stage)
    {
        return $query->where('review_stage', $stage);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByReviewer($query, $reviewerId)
    {
        return $query->where('reviewer_id', $reviewerId);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeNeedsRevision($query)
    {
        return $query->where('status', 'needs_revision');
    }

    // Static methods
    public static function createForApplication(ScholarshipApplication $application, string $stage, int $reviewerId, string $reviewerRole): self
    {
        return self::create([
            'application_id' => $application->id,
            'review_stage' => $stage,
            'reviewer_id' => $reviewerId,
            'reviewer_role' => $reviewerRole,
            'status' => 'pending',
        ]);
    }
}
