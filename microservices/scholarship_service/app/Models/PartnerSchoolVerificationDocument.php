<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSchoolVerificationDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'school_id',
        'document_type',
        'document_name',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'verification_status',
        'verification_notes',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    /**
     * Get the application this document belongs to
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(PartnerSchoolApplication::class, 'application_id');
    }

    /**
     * Get the school this document belongs to
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the user ID who verified this document
     * Note: User data is in auth service, this is just the ID reference
     */
    public function getVerifiedByIdAttribute()
    {
        return $this->attributes['verified_by'];
    }

    /**
     * Scope to filter by verification status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('verification_status', $status);
    }

    /**
     * Scope to get pending documents
     */
    public function scopePending($query)
    {
        return $query->where('verification_status', 'pending');
    }

    /**
     * Scope to get verified documents
     */
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    /**
     * Scope to filter by document type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('document_type', $type);
    }

    /**
     * Check if document is verified
     */
    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    /**
     * Check if document is rejected
     */
    public function isRejected(): bool
    {
        return $this->verification_status === 'rejected';
    }
}
