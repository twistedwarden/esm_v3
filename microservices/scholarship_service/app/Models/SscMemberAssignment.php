<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SSCMemberAssignment extends Model
{
    use HasFactory;

    protected $table = 'ssc_member_assignments';

    protected $fillable = [
        'user_id',
        'ssc_role',
        'review_stage',
        'is_active',
        'assigned_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime'
    ];

    /**
     * Get the user that owns the assignment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include active assignments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include assignments for a specific role
     */
    public function scopeForRole($query, $role)
    {
        return $query->where('ssc_role', $role);
    }

    /**
     * Scope a query to only include assignments for a specific review stage
     */
    public function scopeForStage($query, $stage)
    {
        return $query->where('review_stage', $stage);
    }

    /**
     * Get user roles for a specific user
     */
    public static function getUserRoles($userId)
    {
        return self::where('user_id', $userId)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Stage to role mapping for validation
     */
    const STAGE_ROLE_MAPPING = [
        'document_verification' => ['city_council', 'hrd', 'social_services'],
        'financial_review' => ['budget_dept', 'accounting', 'treasurer'],
        'academic_review' => ['education_affairs', 'qcydo', 'planning_dept', 'schools_division', 'qcu'],
        'final_approval' => ['chairperson'],
    ];
}