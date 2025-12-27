<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSchoolEnrollmentData extends Model
{
    use HasFactory;

    protected $table = 'partner_school_enrollment_data';
    
    protected $fillable = [
        'school_id', 'student_id_number', 'first_name', 'last_name',
        'enrollment_year', 'enrollment_term', 'is_currently_enrolled',
        'enrollment_date', 'program', 'year_level', 'uploaded_by', 'uploaded_at'
    ];

    protected $casts = [
        'is_currently_enrolled' => 'boolean',
        'enrollment_date' => 'date',
        'uploaded_at' => 'datetime',
    ];

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function uploader(): BelongsTo
    {
        // Note: This would link to auth service user if needed
        // For now, we'll just store the ID
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Scopes
    public function scopeBySchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeCurrentlyEnrolled($query)
    {
        return $query->where('is_currently_enrolled', true);
    }

    public function scopeByStudentId($query, $studentId)
    {
        return $query->where('student_id_number', $studentId);
    }

    public function scopeByEnrollmentPeriod($query, $year, $term)
    {
        return $query->where('enrollment_year', $year)
                    ->where('enrollment_term', $term);
    }

    // DUPLICATE CHECK METHOD
    public static function exists(int $schoolId, string $studentId, string $year, string $term): bool
    {
        return self::where('school_id', $schoolId)
            ->where('student_id_number', $studentId)
            ->where('enrollment_year', $year)
            ->where('enrollment_term', $term)
            ->exists();
    }
    
    // UPSERT METHOD to handle duplicates gracefully
    public static function upsertEnrollment(array $data): self
    {
        return self::updateOrCreate(
            [
                'school_id' => $data['school_id'],
                'student_id_number' => $data['student_id_number'],
                'enrollment_year' => $data['enrollment_year'],
                'enrollment_term' => $data['enrollment_term']
            ],
            $data
        );
    }

    // Helper method to get full name
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Helper method to check if student matches
    public function matchesStudent(string $studentId, string $firstName, string $lastName): bool
    {
        return $this->student_id_number === $studentId &&
               strtolower(trim($this->first_name)) === strtolower(trim($firstName)) &&
               strtolower(trim($this->last_name)) === strtolower(trim($lastName));
    }

    // Helper method to calculate name similarity
    public function calculateNameSimilarity(string $firstName, string $lastName): float
    {
        $firstSimilarity = $this->calculateStringSimilarity($this->first_name, $firstName);
        $lastSimilarity = $this->calculateStringSimilarity($this->last_name, $lastName);
        
        // Return average similarity
        return ($firstSimilarity + $lastSimilarity) / 2;
    }

    private function calculateStringSimilarity(string $str1, string $str2): float
    {
        $str1 = strtolower(trim($str1));
        $str2 = strtolower(trim($str2));
        
        if ($str1 === $str2) {
            return 1.0;
        }
        
        // Use Levenshtein distance for similarity calculation
        $maxLength = max(strlen($str1), strlen($str2));
        if ($maxLength === 0) {
            return 0.0;
        }
        
        $distance = levenshtein($str1, $str2);
        return 1 - ($distance / $maxLength);
    }
}

