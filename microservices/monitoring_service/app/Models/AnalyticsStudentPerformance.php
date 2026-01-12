<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsStudentPerformance extends Model
{
    use HasFactory;

    protected $table = 'analytics_student_performance';
    
    protected $fillable = [
        'student_id',
        'academic_term',
        'gpa',
        'attendance_rate',
        'failed_subjects_count',
        'risk_level'
    ];
}
