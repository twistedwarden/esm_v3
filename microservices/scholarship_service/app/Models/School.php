<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\SchoolSpecificTableService;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'campus',
        'contact_number',
        'email',
        'website',
        'classification',
        'address',
        'city',
        'province',
        'region',
        'zip_code',
        'is_public',
        'is_partner_school',
        'is_active',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_partner_school' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // When a school is created and it's a partner school, create its specific table
        static::created(function ($school) {
            if ($school->is_partner_school) {
                try {
                    $schoolTableService = app(SchoolSpecificTableService::class);
                    $schoolTableService->ensureSchoolTableExists($school->id, $school->name);
                    
                    \Log::info("Auto-created school-specific table for new partner school", [
                        'school_id' => $school->id,
                        'school_name' => $school->name,
                        'table_name' => "school_{$school->id}_student_data"
                    ]);
                } catch (\Exception $e) {
                    \Log::error("Failed to create school-specific table for new partner school", [
                        'school_id' => $school->id,
                        'school_name' => $school->name,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        });

        // When a school is updated to become a partner school, create its specific table
        static::updated(function ($school) {
            if ($school->is_partner_school && $school->wasChanged('is_partner_school')) {
                try {
                    $schoolTableService = app(SchoolSpecificTableService::class);
                    $schoolTableService->ensureSchoolTableExists($school->id, $school->name);
                    
                    \Log::info("Auto-created school-specific table for school updated to partner school", [
                        'school_id' => $school->id,
                        'school_name' => $school->name,
                        'table_name' => "school_{$school->id}_student_data"
                    ]);
                } catch (\Exception $e) {
                    \Log::error("Failed to create school-specific table for school updated to partner school", [
                        'school_id' => $school->id,
                        'school_name' => $school->name,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        });
    }

    // Relationships
    public function academicRecords(): HasMany
    {
        return $this->hasMany(AcademicRecord::class);
    }

    public function scholarshipApplications(): HasMany
    {
        return $this->hasMany(ScholarshipApplication::class);
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        $name = $this->name;
        if ($this->campus) {
            $name .= ' - ' . $this->campus;
        }
        return $name;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePartnerSchools($query)
    {
        return $query->where('is_partner_school', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeByClassification($query, $classification)
    {
        return $query->where('classification', $classification);
    }
}
