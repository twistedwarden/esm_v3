<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_schedule_id',
        'application_id',
        'student_id',
        'interviewer_id',
        'interviewer_name',
        'academic_motivation_score',
        'leadership_involvement_score',
        'financial_need_score',
        'character_values_score',
        'overall_recommendation',
        'interview_result',
        'remarks',
        'strengths',
        'areas_for_improvement',
        'additional_notes',
        'evaluation_date',
        'evaluated_by',
    ];

    protected $casts = [
        'academic_motivation_score' => 'integer',
        'leadership_involvement_score' => 'integer',
        'financial_need_score' => 'integer',
        'character_values_score' => 'integer',
        'evaluation_date' => 'datetime',
    ];

    // Relationships
    public function interviewSchedule(): BelongsTo
    {
        return $this->belongsTo(InterviewSchedule::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function interviewer(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'interviewer_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'evaluated_by');
    }

    // Scopes
    public function scopeRecommended($query)
    {
        return $query->where('overall_recommendation', 'recommended');
    }

    public function scopeNotRecommended($query)
    {
        return $query->where('overall_recommendation', 'not_recommended');
    }

    public function scopeNeedsFollowup($query)
    {
        return $query->where('overall_recommendation', 'needs_followup');
    }

    public function scopePassed($query)
    {
        return $query->where('interview_result', 'passed');
    }

    public function scopeFailed($query)
    {
        return $query->where('interview_result', 'failed');
    }

    public function scopeByInterviewer($query, $interviewerId)
    {
        return $query->where('interviewer_id', $interviewerId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('evaluation_date', [$startDate, $endDate]);
    }

    // Methods
    public function getTotalScoreAttribute(): int
    {
        return ($this->academic_motivation_score ?? 0) +
               ($this->leadership_involvement_score ?? 0) +
               ($this->financial_need_score ?? 0) +
               ($this->character_values_score ?? 0);
    }

    public function getAverageScoreAttribute(): float
    {
        $scores = array_filter([
            $this->academic_motivation_score,
            $this->leadership_involvement_score,
            $this->financial_need_score,
            $this->character_values_score,
        ]);

        return count($scores) > 0 ? round(array_sum($scores) / count($scores), 2) : 0;
    }

    public function isRecommended(): bool
    {
        return $this->overall_recommendation === 'recommended';
    }

    public function isNotRecommended(): bool
    {
        return $this->overall_recommendation === 'not_recommended';
    }

    public function needsFollowup(): bool
    {
        return $this->overall_recommendation === 'needs_followup';
    }

    public function isPassed(): bool
    {
        return $this->interview_result === 'passed';
    }

    public function isFailed(): bool
    {
        return $this->interview_result === 'failed';
    }

    public function getScoreDescription($score): string
    {
        return match($score) {
            1 => 'Poor',
            2 => 'Below Average',
            3 => 'Average',
            4 => 'Good',
            5 => 'Excellent',
            default => 'Not Rated'
        };
    }

    public function getRecommendationDescription(): string
    {
        return match($this->overall_recommendation) {
            'recommended' => 'Recommended for SSC Review',
            'not_recommended' => 'Not Recommended',
            'needs_followup' => 'Needs Follow-up',
            default => 'No Recommendation'
        };
    }

    // Static methods
    public static function createFromFormData(InterviewSchedule $schedule, array $evaluationData, int $evaluatedBy): self
    {
        // Map overall recommendation to interview result
        $interviewResult = match($evaluationData['overall_recommendation']) {
            'recommended' => 'passed',
            'not_recommended' => 'failed',
            'needs_followup' => 'needs_followup',
            default => 'needs_followup'
        };

        return self::create([
            'interview_schedule_id' => $schedule->id,
            'application_id' => $schedule->application_id,
            'student_id' => $schedule->student_id,
            'interviewer_id' => $schedule->interviewer_id,
            'interviewer_name' => $schedule->interviewer_name,
            'academic_motivation_score' => $evaluationData['academic_motivation_score'] ?? null,
            'leadership_involvement_score' => $evaluationData['leadership_involvement_score'] ?? null,
            'financial_need_score' => $evaluationData['financial_need_score'] ?? null,
            'character_values_score' => $evaluationData['character_values_score'] ?? null,
            'overall_recommendation' => $evaluationData['overall_recommendation'] ?? null,
            'interview_result' => $interviewResult,
            'remarks' => $evaluationData['remarks'] ?? null,
            'strengths' => $evaluationData['strengths'] ?? null,
            'areas_for_improvement' => $evaluationData['areas_for_improvement'] ?? null,
            'additional_notes' => $evaluationData['additional_notes'] ?? null,
            'evaluation_date' => now(),
            'evaluated_by' => $evaluatedBy,
        ]);
    }
}
