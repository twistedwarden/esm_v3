<?php

/**
 * OTP Integration Test Script
 * 
 * This script tests the Brevo OTP integration without requiring the full Laravel environment.
 * Run this script to verify your Brevo API key is working.
 * 
 * Usage: php test-otp-integration.php
 */

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!getenv($name)) {
            putenv("$name=$value");
        }
    }
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  🧪 Brevo OTP Integration Test\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Check if API key is configured
$apiKey = getenv('BREVO_API_KEY');
$senderEmail = getenv('MAIL_FROM_ADDRESS') ?: 'noreply@govserveph.com';
$senderName = getenv('MAIL_FROM_NAME') ?: 'GoServePH';

echo "📋 Configuration Check:\n";
echo "   API Key: " . ($apiKey ? '✓ Configured' : '✗ Not configured') . "\n";
echo "   Sender Email: $senderEmail\n";
echo "   Sender Name: $senderName\n\n";

if (!$apiKey) {
    echo "❌ Error: BREVO_API_KEY not found in .env file\n";
    echo "   Please add your Brevo API key to the .env file:\n";
    echo "   BREVO_API_KEY=xkeysib-your-api-key-here\n\n";
    exit(1);
}

// Prompt for test email
echo "📧 Enter your email address to receive a test OTP: ";
$testEmail = trim(fgets(STDIN));

if (!filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
    echo "❌ Error: Invalid email address\n";
    exit(1);
}

echo "\n🔄 Sending test OTP email to $testEmail...\n\n";

// Generate test OTP
$otpCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

// Prepare email payload
$htmlContent = getOtpEmailTemplate('Test User', $otpCode, $expiresAt);

$payload = [
    'sender' => [
        'name' => $senderName,
        'email' => $senderEmail,
    ],
    'to' => [
        [
            'email' => $testEmail,
            'name' => 'Test User',
        ]
    ],
    'subject' => 'Test OTP Code - GoServePH',
    'htmlContent' => $htmlContent,
];

// Send email via Brevo API
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.brevo.com/v3/smtp/email',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_SSL_VERIFYPEER => false,  // Disable SSL verification for testing
    CURLOPT_SSL_VERIFYHOST => false,  // Disable SSL host verification
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/json',
        'api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  📊 Test Results\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

if ($error) {
    echo "❌ cURL Error: $error\n\n";
    exit(1);
}

echo "HTTP Status Code: $httpCode\n";
echo "Response: " . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n\n";

if ($httpCode === 201 || $httpCode === 200) {
    echo "✅ SUCCESS! Test OTP email sent successfully!\n";
    echo "   📧 Check your inbox: $testEmail\n";
    echo "   🔐 Your test OTP: $otpCode\n";
    echo "   ⏰ Expires: $expiresAt\n\n";
    echo "💡 Next steps:\n";
    echo "   1. Check your email inbox (and spam folder)\n";
    echo "   2. Verify the email template looks correct\n";
    echo "   3. Start the Laravel service: php artisan serve\n";
    echo "   4. Test the registration flow in your application\n\n";
} else {
    echo "❌ FAILED to send email\n";
    echo "   HTTP Code: $httpCode\n";
    echo "   Response: $response\n\n";
    echo "💡 Troubleshooting:\n";
    echo "   1. Verify your API key is correct\n";
    echo "   2. Check if sender email is verified in Brevo dashboard\n";
    echo "   3. Ensure your Brevo account is active\n";
    echo "   4. Check Brevo API status: https://status.brevo.com/\n\n";
}

function getOtpEmailTemplate($name, $otpCode, $expiresAt)
{
    $minutes = 10;
    
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Test OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">GoServePH</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">🧪 Test Email - OTP Integration</h2>
        
        <p>Hello {$name},</p>
        
        <p>This is a test email to verify your Brevo integration is working correctly. Here's your test OTP:</p>
        
        <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #667eea;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                {$otpCode}
            </div>
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #155724;">
                <strong>✅ Integration Test Successful!</strong><br>
                If you're seeing this email, your Brevo integration is working correctly.
            </p>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
                <strong>⏰ This test OTP would expire in {$minutes} minutes in production.</strong>
            </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            This is a test email sent from your OTP integration test script.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2025 GoServePH. All rights reserved.</p>
            <p>This is an automated test message.</p>
        </div>
    </div>
</body>
</html>
HTML;
}

