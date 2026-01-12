<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsDailyEnrollment extends Model
{
    use HasFactory;

    protected $table = 'analytics_daily_enrollment';
    
    protected $fillable = [
        'snapshot_date',
        'program',
        'year_level',
        'total_students',
        'active_students',
        'dropped_students',
        'graduated_students',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
    ];
}
