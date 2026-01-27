<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicPeriod extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'academic_year',
        'period_type',
        'period_number',
        'start_date',
        'end_date',
        'application_deadline',
        'status',
        'is_current',
    ];

    protected $casts = [
        'period_number' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'application_deadline' => 'date',
        'is_current' => 'boolean',
    ];

    // Scopes
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }
}
