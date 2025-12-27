<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'application_id',
        'scholarship_type',
        'subcategory',
        'approved_amount',
        'start_date',
        'end_date',
        'status',
        'approved_by',
        'notes',
        'disbursement_records',
        'academic_requirements',
        'renewal_requirements',
    ];

    protected $casts = [
        'approved_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'disbursement_records' => 'array',
        'academic_requirements' => 'array',
        'renewal_requirements' => 'array',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('scholarship_type', $type);
    }

    // Methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function getTotalDisbursedAmount(): float
    {
        if (!$this->disbursement_records) {
            return 0;
        }

        return collect($this->disbursement_records)->sum('amount');
    }

    public function getRemainingAmount(): float
    {
        return $this->approved_amount - $this->getTotalDisbursedAmount();
    }

    public function addDisbursementRecord(array $record): void
    {
        $records = $this->disbursement_records ?? [];
        $records[] = array_merge($record, [
            'disbursed_at' => now()->toISOString(),
            'id' => uniqid(),
        ]);
        
        $this->update(['disbursement_records' => $records]);
    }

    public function updateStatus(string $status, string $notes = null): void
    {
        $this->update([
            'status' => $status,
            'notes' => $notes,
        ]);
    }
}
