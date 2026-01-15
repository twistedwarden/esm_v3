<?php

namespace App\Services;

use App\Models\PartnerSchoolApplication;
use App\Models\PartnerSchoolRepresentative;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class PartnerSchoolAccountService
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
        // Generate 12+ character password with mixed case, numbers, and symbols
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
        
        // Shuffle the password
        return str_shuffle($password);
    }

    /**
     * Generate password reset token
     */
    public function generateResetToken(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Create school account with temporary password
     */
    public function createSchoolAccount(
        PartnerSchoolApplication $application,
        array $accountData
    ): array {
        try {
            $temporaryPassword = $this->generateTemporaryPassword();
            $resetToken = $this->generateResetToken();
            $resetExpiresAt = now()->addHours(24);

            // Call auth service API to create user
            $authServiceUrl = env('AUTH_SERVICE_URL', 'http://localhost:8000');
            
            $response = Http::post("{$authServiceUrl}/api/users", [
                'email' => $accountData['email'],
                'password' => $temporaryPassword,
                'first_name' => $accountData['first_name'],
                'last_name' => $accountData['last_name'],
                'middle_name' => $accountData['middle_name'] ?? null,
                'mobile' => $accountData['contact_number'] ?? null,
                'role' => 'ps_rep',
                'assigned_school_id' => $application->school_id,
                'password_reset_required' => true,
                'password_reset_token' => $resetToken,
                'password_reset_expires_at' => $resetExpiresAt->toDateTimeString(),
                'is_active' => true,
                'status' => 'active',
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to create user account: ' . $response->body());
            }

            $userData = $response->json();
            $userId = $userData['data']['id'] ?? null;
            $citizenId = $userData['data']['citizen_id'] ?? null;

            if (!$userId) {
                throw new \Exception('User ID not returned from auth service');
            }

            // Create partner school representative record
            PartnerSchoolRepresentative::create([
                'citizen_id' => $citizenId,
                'school_id' => $application->school_id,
                'is_active' => true,
                'assigned_at' => now(),
            ]);


            // Generate reset link
            $resetLink = env('APP_URL', 'http://localhost:3000') . '/reset-password?token=' . $resetToken;

            // Send credentials email
            $recipientName = $accountData['first_name'] . ' ' . $accountData['last_name'];
            $emailSent = $this->phpMailerService->sendAccountCredentialsEmail(
                $accountData['email'],
                $recipientName,
                $temporaryPassword,
                $resetLink
            );

            if (!$emailSent) {
                Log::warning('Account created but email failed to send', [
                    'application_id' => $application->id,
                    'user_id' => $userId
                ]);
            }

            Log::info('School account created', [
                'application_id' => $application->id,
                'user_id' => $userId,
                'email' => $accountData['email']
            ]);

            return [
                'success' => true,
                'user_id' => $userId,
                'citizen_id' => $citizenId,
                'email_sent' => $emailSent,
                'temporary_password' => $temporaryPassword, // Only for logging, not returned to client
            ];
        } catch (\Exception $e) {
            Log::error('Error creating school account: ' . $e->getMessage(), [
                'application_id' => $application->id,
                'email' => $accountData['email'] ?? 'unknown'
            ]);
            throw $e;
        }
    }
}
