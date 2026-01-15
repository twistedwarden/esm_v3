<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsDemographicsDaily extends Model
{
    protected $table = 'analytics_demographics_daily';

    protected $fillable = [
        'snapshot_date',
        'total_students',
        'currently_enrolled',
        'graduating_students',
        'new_registrations_today',
        'male_count',
        'female_count',
        'pwd_count',
        'solo_parent_count',
        'indigenous_count',
        'fourps_beneficiary_count',
        'informal_settler_count',
        'partner_schools_count',
        'caloocan_school_applicants',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
    ];

    /**
     * Get PWD percentage
     */
    public function getPwdPercentageAttribute(): float
    {
        return $this->total_students > 0 
            ? round(($this->pwd_count / $this->total_students) * 100, 1) 
            : 0;
    }

    /**
     * Get 4Ps percentage
     */
    public function getFourpsPercentageAttribute(): float
    {
        return $this->total_students > 0 
            ? round(($this->fourps_beneficiary_count / $this->total_students) * 100, 1) 
            : 0;
    }

    /**
     * Get enrollment rate
     */
    public function getEnrollmentRateAttribute(): float
    {
        return $this->total_students > 0 
            ? round(($this->currently_enrolled / $this->total_students) * 100, 1) 
            : 0;
    }
}
