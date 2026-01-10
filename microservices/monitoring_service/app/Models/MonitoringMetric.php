<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonitoringMetric extends Model
{
    protected $fillable = [
        'metric_name',
        'metric_value',
        'metric_data',
        'metric_date',
        'notes'
    ];
    
    protected $casts = [
        'metric_data' => 'array',
        'metric_date' => 'date',
        'metric_value' => 'decimal:2'
    ];
}
