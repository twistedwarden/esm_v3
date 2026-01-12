<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsSystemMetric extends Model
{
    use HasFactory;

    protected $table = 'analytics_system_metrics';
    
    protected $fillable = [
        'recorded_at',
        'metric_type',
        'value',
        'metadata'
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'metadata' => 'array'
    ];
}
