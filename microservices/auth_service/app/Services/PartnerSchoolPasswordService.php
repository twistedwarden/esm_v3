<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PartnerSchoolPasswordService
{
    private $phpMailerService;

    public function __construct(PhpMailerService $phpMailerService)
    {
        $this->phpMailerService = $phpMailerService;
    }

    /**
     * Generate secure temporary password
     */
    public function generateTemporaryPassword(): string
    {
        $length = 12;
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        
        // Ensure at least one of each type
        $password .= chr(rand(65, 90)); // Uppercase
        $password .= chr(rand(97, 122)); // Lowercase
        $password .= chr(rand(48, 57)); // Number
        $password .= '!@#$%^&*'[rand(0, 7)]; // Symbol
        
        // Fill the rest randomly
        for ($i = strlen($password); $i < $length; $i++) {
            $password .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        return str_shuffle($password);
    }

    /**
     * Check if password reset is required
     */
    public function checkPasswordResetRequired(User $user): bool
    {
        return $user->password_reset_required === true;
    }

    /**
     * Validate password reset token
     */
    public function validateResetToken(string $token): ?User
    {
        $user = User::where('password_reset_token', $token)
            ->where('password_reset_expires_at', '>', now())
            ->first();

        return $user;
    }

    /**
     * Reset password using token
     */
    public function resetPasswordWithToken(string $token, string $newPassword): bool
    {
        $user = $this->validateResetToken($token);
        
        if (!$user) {
            return false;
        }

        $user->update([
            'password' => Hash::make($newPassword),
            'password_reset_required' => false,
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ]);

        Log::info('Password reset via token', ['user_id' => $user->id]);
        return true;
    }

    /**
     * Force password reset on first login
     */
    public function forcePasswordReset(User $user, string $currentPassword, string $newPassword): bool
    {
        // Verify current password
        if (!Hash::check($currentPassword, $user->password)) {
            return false;
        }

        // Check if reset is required
        if (!$user->password_reset_required) {
            return false;
        }

        // Update password and clear reset flag
        $user->update([
            'password' => Hash::make($newPassword),
            'password_reset_required' => false,
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ]);

        Log::info('Forced password reset completed', ['user_id' => $user->id]);
        return true;
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(User $user): bool
    {
        $token = Str::uuid()->toString();
        $expiresAt = now()->addHours(24);

        $user->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => $expiresAt,
        ]);

        $resetLink = env('APP_URL', 'http://localhost:3000') . '/reset-password?token=' . $token;
        $recipientName = $user->first_name . ' ' . $user->last_name;

        return $this->phpMailerService->sendPasswordResetEmail(
            $user->email,
            $recipientName,
            $resetLink
        );
    }
}
