<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountLockout extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'locked_until',
        'failed_attempts',
        'last_attempt_at'
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'last_attempt_at' => 'datetime'
    ];

    /**
     * Check if account is currently locked
     */
    public function isLocked(): bool
    {
        return $this->locked_until && now()->lt($this->locked_until);
    }

    /**
     * Get remaining lockout time in seconds
     */
    public function getRemainingSeconds(): int
    {
        if (!$this->isLocked()) {
            return 0;
        }

        return max(0, now()->diffInSeconds($this->locked_until, false));
    }
}
