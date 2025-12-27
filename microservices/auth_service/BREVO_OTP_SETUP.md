# Brevo OTP Setup Guide

This guide explains how to configure Brevo (formerly Sendinblue) for OTP email delivery in the authentication service.

## Prerequisites

1. A Brevo account (free tier available)
2. Verified sender email address in Brevo

## Setup Steps

### 1. Create Brevo Account

1. Go to [https://www.brevo.com/](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to Brevo dashboard
2. Go to **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Give it a name (e.g., "GoServePH Auth Service")
5. Copy the generated API key (starts with `xkeysib-`)

### 3. Verify Sender Email

1. In Brevo dashboard, go to **Senders**
2. Add and verify your sender email address (e.g., noreply@govserveph.com)
3. Complete the verification process

### 4. Configure Environment Variables

Create or update your `.env` file in `microservices/auth_service/`:

```env
# Brevo (Sendinblue) Email Configuration
BREVO_API_KEY=xkeysib-your-actual-api-key-here
MAIL_FROM_ADDRESS=your-verified-email@domain.com
MAIL_FROM_NAME=GoServePH
```

**Important:** Replace the placeholder values with your actual credentials:

-   `BREVO_API_KEY`: Your Brevo API key from step 2
-   `MAIL_FROM_ADDRESS`: Your verified sender email from step 3
-   `MAIL_FROM_NAME`: The name that appears in the "From" field

### 5. Test the Configuration

Run the following command to ensure everything is working:

```bash
cd microservices/auth_service
php artisan tinker
```

Then in the tinker console:

```php
$service = new \App\Services\BrevoEmailService();
$service->sendOtpEmail('test@example.com', 'Test User', '123456', now()->addMinutes(5));
```

## API Endpoints

### Register with OTP

```
POST /api/register
```

Automatically sends OTP email upon successful registration.

### Send OTP

```
POST /api/send-otp
Body: { "email": "user@example.com" }
```

Sends OTP for email verification.

### Verify OTP

```
POST /api/verify-otp
Body: { "email": "user@example.com", "otp_code": "123456" }
```

Verifies the OTP and activates the account.

### Request Login OTP

```
POST /api/request-login-otp
Body: { "email": "user@example.com" }
```

Sends OTP for passwordless login.

### Login with OTP

```
POST /api/login-with-otp
Body: { "email": "user@example.com", "otp_code": "123456" }
```

Logs in user using OTP instead of password.

## OTP Features

-   **6-digit numeric OTP** for security
-   **5-minute expiration** for safety
-   **One-time use** - each OTP can only be used once
-   **Beautiful HTML email templates** with branding
-   **Type-specific OTPs** - separate for registration and login
-   **Automatic invalidation** of old OTPs when requesting new ones

## Email Templates

The service includes three professionally designed email templates:

1. **Registration OTP** - Sent after user registration
2. **Login OTP** - Sent for passwordless login
3. **Verification Email** - Link-based verification (legacy support)

## Brevo Free Tier Limits

-   **300 emails per day**
-   Unlimited contacts
-   API access included
-   Perfect for development and small-scale production

## Troubleshooting

### OTP emails not sending

1. Check your Brevo API key is correct in `.env`
2. Verify your sender email is verified in Brevo dashboard
3. Check Laravel logs: `storage/logs/laravel.log`
4. Ensure your Brevo account is active and not suspended

### API Key errors

```
Error: Email service not configured
```

Solution: Add `BREVO_API_KEY` to your `.env` file

### Sender email not verified

```
Error: Failed to send email. HTTP Code: 400
```

Solution: Verify your sender email in Brevo dashboard

### Rate limiting

If you exceed 300 emails/day on free tier:

-   Upgrade to paid plan, or
-   Implement email queuing/throttling

## Security Best Practices

1. **Never commit** `.env` file to version control
2. **Rotate API keys** regularly
3. **Use environment-specific** keys (dev/staging/prod)
4. **Monitor email usage** in Brevo dashboard
5. **Implement rate limiting** to prevent abuse

## Support

-   **Brevo Documentation**: https://developers.brevo.com/
-   **Brevo Support**: https://help.brevo.com/
-   **Service Status**: https://status.brevo.com/

## Next Steps

After setup:

1. Test registration flow with real email
2. Verify OTP delivery time (usually < 5 seconds)
3. Test OTP expiration (5 minutes)
4. Test resend OTP functionality
5. Monitor Brevo dashboard for delivery statistics
