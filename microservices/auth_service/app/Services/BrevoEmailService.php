<?php

namespace App\Services;

use Exception;

class BrevoEmailService
{
    private $apiKey;
    private $apiUrl = 'https://api.brevo.com/v3/smtp/email';
    private $senderEmail;
    private $senderName;

    public function __construct()
    {
        $this->apiKey = env('BREVO_API_KEY');
        $this->senderEmail = env('MAIL_FROM_ADDRESS', 'noreply@govserveph.com');
        $this->senderName = env('MAIL_FROM_NAME', 'GoServePH');
    }

    /**
     * Send OTP email via Brevo
     */
    public function sendOtpEmail($recipientEmail, $recipientName, $otpCode, $expiresAt)
    {
        $htmlContent = $this->getOtpEmailTemplate($recipientName, $otpCode, $expiresAt);
        
        return $this->sendEmail(
            $recipientEmail,
            $recipientName,
            'Your OTP Code - GoServePH',
            $htmlContent
        );
    }

    /**
     * Send verification email via Brevo
     */
    public function sendVerificationEmail($recipientEmail, $recipientName, $verificationUrl)
    {
        $htmlContent = $this->getVerificationEmailTemplate($recipientName, $verificationUrl);
        
        return $this->sendEmail(
            $recipientEmail,
            $recipientName,
            'Verify Your Email Address - GoServePH',
            $htmlContent
        );
    }

    /**
     * Send OTP for login via Brevo
     */
    public function sendLoginOtpEmail($recipientEmail, $recipientName, $otpCode, $expiresAt)
    {
        $htmlContent = $this->getLoginOtpEmailTemplate($recipientName, $otpCode, $expiresAt);
        
        return $this->sendEmail(
            $recipientEmail,
            $recipientName,
            'Your Login OTP Code - GoServePH',
            $htmlContent
        );
    }

    /**
     * Core email sending method using Brevo API
     */
    private function sendEmail($recipientEmail, $recipientName, $subject, $htmlContent)
    {
        if (!$this->apiKey) {
            \Log::error('Brevo API key not configured');
            throw new Exception('Email service not configured');
        }

        $payload = [
            'sender' => [
                'name' => $this->senderName,
                'email' => $this->senderEmail,
            ],
            'to' => [
                [
                    'email' => $recipientEmail,
                    'name' => $recipientName,
                ]
            ],
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ];

        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_SSL_VERIFYPEER => false,  // Disable SSL verification for development
            CURLOPT_SSL_VERIFYHOST => false,  // Disable SSL host verification
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/json',
                'api-key: ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            \Log::error('Brevo API cURL error: ' . $error);
            throw new Exception('Failed to send email: ' . $error);
        }

        if ($httpCode !== 201 && $httpCode !== 200) {
            \Log::error('Brevo API error: ' . $response);
            throw new Exception('Failed to send email. HTTP Code: ' . $httpCode);
        }

        return true;
    }

    /**
     * Get OTP email HTML template
     */
    private function getOtpEmailTemplate($name, $otpCode, $expiresAt)
    {
        $minutes = 10; // OTP expires in 10 minutes
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">GoServePH</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Email Verification</h2>
        
        <p>Hello {$name},</p>
        
        <p>Thank you for registering with GoServePH. To complete your registration, please use the following One-Time Password (OTP):</p>
        
        <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #667eea;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                {$otpCode}
            </div>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
                <strong>⏰ This OTP will expire in {$minutes} minutes.</strong>
            </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            If you didn't request this code, please ignore this email or contact our support team if you have concerns.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2025 GoServePH. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Get login OTP email HTML template
     */
    private function getLoginOtpEmailTemplate($name, $otpCode, $expiresAt)
    {
        $minutes = 10; // OTP expires in 10 minutes
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">GoServePH</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Login Verification</h2>
        
        <p>Hello {$name},</p>
        
        <p>You requested to login to your GoServePH account. Please use the following One-Time Password (OTP):</p>
        
        <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #667eea;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                {$otpCode}
            </div>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
                <strong>⏰ This OTP will expire in {$minutes} minutes.</strong>
            </p>
        </div>
        
        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #721c24;">
                <strong>🔐 Security Notice:</strong> If you didn't attempt to login, please secure your account immediately and contact support.
            </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            This login attempt was made from your registered email address. For security reasons, please do not share this code with anyone.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2025 GoServePH. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Get verification email HTML template
     */
    private function getVerificationEmailTemplate($name, $verificationUrl)
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">GoServePH</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Verify Your Email Address</h2>
        
        <p>Hello {$name},</p>
        
        <p>Thank you for registering with GoServePH. Please click the button below to verify your email address and activate your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{$verificationUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Verify Email Address
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{$verificationUrl}" style="color: #667eea; word-break: break-all;">{$verificationUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
            If you didn't create an account, please ignore this email.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2025 GoServePH. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}

