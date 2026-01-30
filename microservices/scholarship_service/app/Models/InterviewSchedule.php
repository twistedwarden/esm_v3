<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class InterviewSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'student_id',
        'interview_date',
        'interview_time',
        'interview_location',
        'interview_type',
        'meeting_link',
        'interviewer_id',
        'staff_id',
        'interviewer_name',
        'scheduling_type',
        'status',
        'interview_notes',
        'interview_result',
        'completed_at',
        'scheduled_by',
        'duration',
    ];

    protected $casts = [
        'interview_date' => 'date',
        'interview_time' => 'string',
        'completed_at' => 'datetime',
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

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function evaluation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(InterviewEvaluation::class);
    }

    // Scopes
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeNoShow($query)
    {
        return $query->where('status', 'no_show');
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('interview_date', $date);
    }

    public function scopeByInterviewer($query, $interviewerId)
    {
        return $query->where('interviewer_id', $interviewerId);
    }

    public function scopeByStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('interview_date', '>=', now()->toDateString())
            ->where('status', 'scheduled');
    }

    public function scopePast($query)
    {
        return $query->where('interview_date', '<', now()->toDateString());
    }

    // Methods
    public function markAsCompleted($result, $notes, $completedBy): bool
    {
        if (!$this->canBeCompleted()) {
            return false;
        }

        $this->update([
            'status' => 'completed',
            'interview_result' => $result,
            'interview_notes' => $notes,
            'completed_at' => now(),
        ]);

        return true;
    }

    public function reschedule($newDate, $newTime, $reason, $rescheduledBy, $newDuration = null): bool
    {
        if (!$this->canBeRescheduled()) {
            return false;
        }

        $updateData = [
            'interview_date' => $newDate,
            'interview_time' => $newTime,
            'status' => 'rescheduled',
            'interview_notes' => $this->interview_notes . "\n\nRescheduled: " . $reason . " (by: " . $rescheduledBy . ")",
        ];

        if ($newDuration !== null) {
            $updateData['duration'] = $newDuration;
        }

        $this->update($updateData);

        return true;
    }

    public function cancel($reason, $cancelledBy): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->update([
            'status' => 'cancelled',
            'interview_notes' => $this->interview_notes . "\n\nCancelled: " . $reason . " (by: " . $cancelledBy . ")",
        ]);

        return true;
    }

    public function markAsNoShow($notes, $markedBy): bool
    {
        if (!$this->canBeMarkedAsNoShow()) {
            return false;
        }

        $this->update([
            'status' => 'no_show',
            'interview_notes' => $this->interview_notes . "\n\nNo Show: " . $notes . " (by: " . $markedBy . ")",
        ]);

        return true;
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isNoShow(): bool
    {
        return $this->status === 'no_show';
    }

    public function isPassed(): bool
    {
        return $this->interview_result === 'passed';
    }

    public function isFailed(): bool
    {
        return $this->interview_result === 'failed';
    }

    public function needsFollowup(): bool
    {
        return $this->interview_result === 'needs_followup';
    }

    public function canBeCompleted(): bool
    {
        return in_array($this->status, ['scheduled', 'rescheduled']);
    }

    public function canBeRescheduled(): bool
    {
        return in_array($this->status, ['scheduled', 'rescheduled']);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['scheduled', 'rescheduled']);
    }

    public function canBeMarkedAsNoShow(): bool
    {
        return in_array($this->status, ['scheduled', 'rescheduled']);
    }

    public function isUpcoming(): bool
    {
        return $this->interview_date >= now()->toDateString() && $this->isScheduled();
    }

    public function isPast(): bool
    {
        return $this->interview_date < now()->toDateString();
    }

    public function getFormattedDateTimeAttribute(): string
    {
        $date = Carbon::parse($this->interview_date);
        $time = Carbon::createFromFormat('H:i:s', $this->interview_time);

        return $date->format('M d, Y') . ' at ' . $time->format('g:i A');
    }

    public function getFullLocationAttribute(): string
    {
        if ($this->interview_type === 'online') {
            return 'Online' . ($this->meeting_link ? ' - ' . $this->meeting_link : '');
        }

        return $this->interview_location ?? 'TBD';
    }

    // Static methods
    public static function createForApplication(ScholarshipApplication $application, array $data): self
    {
        return self::create([
            'application_id' => $application->id,
            'student_id' => $application->student_id,
            'interview_date' => $data['interview_date'],
            'interview_time' => $data['interview_time'],
            'interview_location' => $data['interview_location'] ?? null,
            'interview_type' => $data['interview_type'] ?? 'in_person',
            'meeting_link' => $data['meeting_link'] ?? null,
            'interviewer_id' => $data['interviewer_id'] ?? null,
            'staff_id' => $data['staff_id'] ?? null,
            'interviewer_name' => $data['interviewer_name'],
            'scheduling_type' => $data['scheduling_type'] ?? 'manual',
            'status' => 'scheduled',
            'scheduled_by' => $data['scheduled_by'],
            'duration' => $data['duration'] ?? 30, // Default 30 minutes
        ]);
    }
}






