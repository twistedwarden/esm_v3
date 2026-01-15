<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerSchoolApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'status',
        'rejection_reason',
        'submitted_by',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
        'admin_notes',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the school associated with this application
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the user ID who submitted this application
     * Note: User data is in auth service, this is just the ID reference
     */
    public function getSubmittedByIdAttribute()
    {
        return $this->attributes['submitted_by'];
    }

    /**
     * Get the user ID who reviewed this application
     * Note: User data is in auth service, this is just the ID reference
     */
    public function getReviewedByIdAttribute()
    {
        return $this->attributes['reviewed_by'];
    }

    /**
     * Get verification documents for this application
     */
    public function verificationDocuments(): HasMany
    {
        return $this->hasMany(PartnerSchoolVerificationDocument::class, 'application_id');
    }


    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending applications
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', ['submitted', 'under_review']);
    }

    /**
     * Check if application can be submitted
     */
    public function canBeSubmitted(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if application can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === 'under_review';
    }

    /**
     * Check if all documents are verified
     */
    public function allDocumentsVerified(): bool
    {
        $documents = $this->verificationDocuments;
        if ($documents->isEmpty()) {
            return false;
        }
        
        return $documents->every(function ($doc) {
            return $doc->verification_status === 'verified';
        });
    }
}
