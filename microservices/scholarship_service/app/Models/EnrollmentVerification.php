<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'student_id',
        'school_id',
        'verification_status',
        'enrollment_proof_document_id',
        'verified_by',
        'verified_at',
        'verification_notes',
        'enrollment_year',
        'enrollment_term',
        'is_currently_enrolled',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'is_currently_enrolled' => 'boolean',
    ];

    // Relationships
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function enrollmentProofDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'enrollment_proof_document_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('verification_status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }

    public function scopeNeedsReview($query)
    {
        return $query->where('verification_status', 'needs_review');
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    // Methods
    public function verify($verifiedBy, $notes = null): bool
    {
        if (!$this->canBeVerified()) {
            return false;
        }

        $this->update([
            'verification_status' => 'verified',
            'verified_by' => $verifiedBy,
            'verified_at' => now(),
            'verification_notes' => $notes,
        ]);

        return true;
    }

    public function reject($rejectedBy, $reason): bool
    {
        if (!$this->canBeRejected()) {
            return false;
        }

        $this->update([
            'verification_status' => 'rejected',
            'verified_by' => $rejectedBy,
            'verified_at' => now(),
            'verification_notes' => $reason,
        ]);

        return true;
    }

    public function needsReview($notes): bool
    {
        $this->update([
            'verification_status' => 'needs_review',
            'verification_notes' => $notes,
        ]);

        return true;
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->verification_status === 'rejected';
    }

    public function isPending(): bool
    {
        return $this->verification_status === 'pending';
    }

    public function needsReviewStatus(): bool
    {
        return $this->verification_status === 'needs_review';
    }

    public function canBeVerified(): bool
    {
        return in_array($this->verification_status, ['pending', 'needs_review']);
    }

    public function canBeRejected(): bool
    {
        return in_array($this->verification_status, ['pending', 'needs_review']);
    }

    public function canBeReviewed(): bool
    {
        return $this->verification_status === 'pending';
    }

    // Static methods
    public static function createForApplication(ScholarshipApplication $application): self
    {
        return self::create([
            'application_id' => $application->id,
            'student_id' => $application->student_id,
            'school_id' => $application->school_id,
            'verification_status' => 'pending',
            'enrollment_year' => $application->student->currentAcademicRecord?->school_year,
            'enrollment_term' => $application->student->currentAcademicRecord?->school_term,
        ]);
    }
}







