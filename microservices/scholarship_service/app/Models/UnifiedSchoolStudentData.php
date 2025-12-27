<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnifiedSchoolStudentData extends Model
{
    use HasFactory;

    protected $table = 'unified_school_student_data';

    protected $fillable = [
        'school_id',
        'student_id_number',
        'first_name',
        'last_name',
        'middle_name',
        'extension_name',
        'citizen_id',
        'sex',
        'civil_status',
        'nationality',
        'birth_place',
        'birth_date',
        'contact_number',
        'email_address',
        'is_currently_enrolled',
        'is_graduating',
        'educational_level',
        'program',
        'major',
        'year_level',
        'school_year',
        'school_term',
        'units_enrolled',
        'gpa',
        'enrollment_date',
        'graduation_date',
        'upload_batch_id',
        'original_filename',
        'uploaded_at',
    ];

    protected $casts = [
        'is_currently_enrolled' => 'boolean',
        'is_graduating' => 'boolean',
        'birth_date' => 'date',
        'enrollment_date' => 'date',
        'graduation_date' => 'date',
        'uploaded_at' => 'datetime',
        'units_enrolled' => 'integer',
        'gpa' => 'decimal:2',
    ];

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    // Scopes
    public function scopeCurrentlyEnrolled($query)
    {
        return $query->where('is_currently_enrolled', true);
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeByGender($query, $gender)
    {
        return $query->where('sex', $gender);
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        if ($this->extension_name) {
            $name .= ' ' . $this->extension_name;
        }
        return $name;
    }
}
