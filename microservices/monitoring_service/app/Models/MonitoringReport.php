<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonitoringReport extends Model
{
    protected $fillable = [
        'report_type',
        'generated_by',
        'parameters',
        'file_url'
    ];
    
    protected $casts = [
        'parameters' => 'array',
        'generated_at' => 'datetime'
    ];
}
