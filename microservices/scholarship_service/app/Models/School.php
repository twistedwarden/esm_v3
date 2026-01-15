<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'verification_status',
        'verification_date',
        'verification_expiry_date',
        'application_id',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_partner_school' => 'boolean',
        'is_active' => 'boolean',
        'verification_date' => 'date',
        'verification_expiry_date' => 'date',
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

    /**
     * Get the partner school application for this school
     */
    public function partnerSchoolApplication(): BelongsTo
    {
        return $this->belongsTo(PartnerSchoolApplication::class, 'application_id');
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

    /**
     * Scope to filter by verification status
     */
    public function scopeByVerificationStatus($query, $status)
    {
        return $query->where('verification_status', $status);
    }

    /**
     * Scope to get verified schools
     */
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    /**
     * Check if school is verified
     */
    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    /**
     * Check if verification is expired
     */
    public function isVerificationExpired(): bool
    {
        if (!$this->verification_expiry_date) {
            return false;
        }
        
        return $this->verification_expiry_date->isPast();
    }
}
