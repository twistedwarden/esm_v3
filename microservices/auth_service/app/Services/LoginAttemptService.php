<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\AccountLockout;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoginAttemptService
{
    protected $settingsService;

    public function __construct(SecuritySettingsService $settingsService)
    {
        $this->settingsService = $settingsService;
    }

    /**
     * Record a login attempt
     *
     * @param string $email
     * @param string $ip
     * @param boolean $success
     * @param string|null $userAgent
     * @return LoginAttempt
     */
    public function recordAttempt($email, $ip, $success, $userAgent = null)
    {
        return LoginAttempt::create([
            'email' => $email,
            'ip_address' => $ip,
            'attempt_time' => now(),
            'success' => $success,
            'user_agent' => $userAgent
        ]);
    }

    /**
     * Check if the account is currently locked out
     *
     * @param string $email
     * @return array|null Returns lockout info if locked, null otherwise
     */
    public function checkLockout($email)
    {
        // 1. Check active lockout in AccountLockout table
        $lockout = AccountLockout::where('email', $email)
            ->where('locked_until', '>', now())
            ->first();

        if ($lockout) {
            return [
                'locked' => true,
                'reason' => 'Too many failed attempts',
                'remaining_seconds' => $lockout->getRemainingSeconds(),
                'locked_until' => $lockout->locked_until
            ];
        }

        return null;
    }

    /**
     * Analyze recent failures and determine if lockout or warning is needed
     * Should be called AFTER a failed login attempt.
     *
     * @param string $email
     * @return array Status info (warning, lockout, or nothing)
     */
    public function analyzeRecentFailures($email)
    {
        $windowSeconds = $this->settingsService->getSetting('login_attempt_window', 900);
        $windowStart = now()->subSeconds($windowSeconds);

        // Count consecutive failed attempts in the window (reset by success)
        $failedAttempts = $this->getConsecutiveFailedAttempts($email);

        $lockoutThreshold = $this->settingsService->getSetting('login_lockout_threshold', 7);
        $warningThreshold = $this->settingsService->getSetting('login_warning_threshold', 5);

        if ($failedAttempts >= $lockoutThreshold) {
            // Create Lockout
            $duration = $this->settingsService->getSetting('login_lockout_duration', 120);
            $lockedUntil = now()->addSeconds($duration);

            AccountLockout::updateOrCreate(
                ['email' => $email],
                [
                    'locked_until' => $lockedUntil,
                    'failed_attempts' => $failedAttempts,
                    'last_attempt_at' => now()
                ]
            );

            return [
                'status' => 'lockout',
                'message' => "Account locked for {$duration} seconds.",
                'remaining_attempts' => 0,
                'locked_until' => $lockedUntil
            ];
        }

        if ($failedAttempts >= $warningThreshold) {
            $remaining = $lockoutThreshold - $failedAttempts;
            return [
                'status' => 'warning',
                'message' => "Warning: {$remaining} attempts remaining before lockout.",
                'remaining_attempts' => $remaining
            ];
        }

        return [
            'status' => 'normal',
            'failed_attempts' => $failedAttempts
        ];
    }

    /**
     * Clear lockout and login history for successful login
     *
     * @param string $email
     */
    public function clearLoginFailures($email)
    {
        // Remove Lockout record
        AccountLockout::where('email', $email)->delete();

        // We do NOT delete the LoginAttempt history as it's an audit trail,
        // but the 'checkLockout' logic relies on recent failures in a window.
        // If we want to "reset" the counter, we strictly don't need to delete rows 
        // if we change logic, but standard practice is often just to ensure no active lockout.
        // However, if we count failures in last X minutes, a successful login should probably 
        // effectively "reset" the counting for lockout purposes.
        // The simplest way to "reset" the count for the Logic above is to ensure future checks 
        // don't count past failures against the NEW session. 
        // But since we query by time window, old failures will naturally expire.
        // To strictly "Reset", we could mark them as "reset" or "cleared" if we added a column,
        // OR we can just rely on the fact that the user is now logged in.
        // BUT, if they log out immediately and fail once, should they be locked out again?
        // Ideally, no. A successful login should reset the "consecutive failed attempts" counter.
        // One way to do this is to check for the LAST SUCCESSFUL login in the window 
        // and only count failures occurring AFTER that.
    }

    /**
     * Get failed attempt count since the last successful login
     * (Refined logic for analyzeRecentFailures)
     */
    public function getConsecutiveFailedAttempts($email)
    {
        $windowSeconds = $this->settingsService->getSetting('login_attempt_window', 900);
        $windowStart = now()->subSeconds($windowSeconds);

        // Find last successful login
        $lastSuccess = LoginAttempt::where('email', $email)
            ->where('success', true)
            ->where('attempt_time', '>=', $windowStart)
            ->latest('attempt_time')
            ->first();

        $query = LoginAttempt::where('email', $email)
            ->where('success', false)
            ->where('attempt_time', '>=', $windowStart);

        if ($lastSuccess) {
            $query->where('attempt_time', '>', $lastSuccess->attempt_time);
        }

        return $query->count();
    }
}
