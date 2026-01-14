<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\AuthServiceClient;

class Staff extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'citizen_id',
        'system_role',
        'department',
        'position',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the interview schedules for this staff member.
     */
    public function interviewSchedules(): HasMany
    {
        return $this->hasMany(InterviewSchedule::class);
    }

    /**
     * Scope a query to only include active staff.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include interviewers.
     */
    public function scopeInterviewers($query)
    {
        return $query->where('system_role', 'interviewer');
    }

    /**
     * Get the staff member's full name from the auth service.
     */
    public function getFullNameAttribute(): string
    {
        $user = $this->getUserFromAuthService();
        return $user['name'] ?? 'Unknown User';
    }

    /**
     * Get the staff member's email from the auth service.
     */
    public function getEmailAttribute(): string
    {
        $user = $this->getUserFromAuthService();
        return $user['email'] ?? 'unknown@example.com';
    }

    /**
     * Get user data from auth service.
     */
    public function getUserFromAuthService(): ?array
    {
        $authService = app(AuthServiceClient::class);
        return $authService->getUserById($this->user_id);
    }

    /**
     * Get staff member with user data from auth service.
     */
    public function withUserData(): array
    {
        $userData = $this->getUserFromAuthService();
        
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'citizen_id' => $this->citizen_id,
            'system_role' => $this->system_role,
            'department' => $this->department,
            'position' => $this->position,
            'is_active' => $this->is_active,
            'name' => $userData['name'] ?? 'Unknown User',
            'email' => $userData['email'] ?? 'unknown@example.com',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Get all active interviewers with user data from auth service.
     */
    public static function getActiveInterviewersWithUserData(): array
    {
        try {
            $staff = self::active()->interviewers()->get();
            
            if ($staff->isEmpty()) {
                return [];
            }
            
            // Get user IDs from staff records (filter out null user_ids)
            $userIds = $staff->pluck('user_id')->filter()->unique()->toArray();
            
            if (empty($userIds)) {
                // Return staff without user data if no user_ids are available
                return $staff->map(function ($staffMember) {
                    return [
                        'id' => (int) $staffMember->id,
                        'user_id' => $staffMember->user_id ? (int) $staffMember->user_id : null,
                        'name' => 'Unknown User',
                        'email' => 'unknown@example.com',
                        'system_role' => $staffMember->system_role ?? 'interviewer',
                        'department' => $staffMember->department ?? null,
                        'position' => $staffMember->position ?? null,
                        'citizen_id' => $staffMember->citizen_id ?? null,
                        'is_active' => (bool) ($staffMember->is_active ?? true),
                    ];
                })->filter(function ($staffData) {
                    // Filter out any invalid entries (must have at least an id)
                    return isset($staffData['id']) && $staffData['id'] > 0;
                })->values()->toArray();
            }
            
            // Fetch user data from auth service
            $authService = app(\App\Services\AuthServiceClient::class);
            $users = $authService->getUsersByIds($userIds);
            
            return $staff->map(function ($staffMember) use ($users) {
                $userData = $users[$staffMember->user_id] ?? null;
                
                // Build name from user data
                $name = 'Unknown User';
                if ($userData) {
                    $firstName = trim($userData['first_name'] ?? '');
                    $lastName = trim($userData['last_name'] ?? '');
                    $fullName = trim($firstName . ' ' . $lastName);
                    $name = $fullName ?: 'Unknown User';
                }
                
                return [
                    'id' => (int) $staffMember->id,
                    'user_id' => $staffMember->user_id ? (int) $staffMember->user_id : null,
                    'name' => $name,
                    'email' => ($userData && isset($userData['email'])) ? $userData['email'] : 'unknown@example.com',
                    'system_role' => $staffMember->system_role ?? 'interviewer',
                    'department' => $staffMember->department ?? null,
                    'position' => $staffMember->position ?? null,
                    'citizen_id' => $staffMember->citizen_id ?? null,
                    'is_active' => (bool) ($staffMember->is_active ?? true),
                ];
            })->filter(function ($staffData) {
                // Filter out any invalid entries (must have at least an id)
                return isset($staffData['id']) && $staffData['id'] > 0;
            })->values()->toArray();
        } catch (\Exception $e) {
            \Log::error('Error in getActiveInterviewersWithUserData', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
