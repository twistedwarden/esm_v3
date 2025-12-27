# 🚀 Quick Start Guide - OTP with Brevo

Get your OTP system up and running in 5 minutes!

## Step 1: Get Your Brevo API Key (2 minutes)

1. Go to [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
2. Create a free account if you don't have one
3. Click **"Generate a new API key"**
4. Give it a name (e.g., "GoServePH")
5. Copy the API key (starts with `xkeysib-`)

## Step 2: Configure Environment (1 minute)

Create/edit `.env` file in `microservices/auth_service/`:

```bash
cd microservices/auth_service
cp .env.example .env  # If .env doesn't exist
```

Add these lines to `.env`:

```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
MAIL_FROM_ADDRESS=noreply@govserveph.com
MAIL_FROM_NAME=GoServePH
```

**Important:** Replace `xkeysib-your-actual-api-key-here` with your real API key!

## Step 3: Test the Integration (1 minute)

Run the test script to verify everything works:

```bash
cd microservices/auth_service
php test-otp-integration.php
```

You'll be prompted for your email. Enter it and check your inbox!

## Step 4: Run Migrations (30 seconds)

```bash
php artisan migrate
```

This creates the `otp_verifications` table.

## Step 5: Start the Service (30 seconds)

```bash
php artisan serve --port=8000
```

## ✅ You're Done!

Your OTP system is ready. Test it:

1. Open your frontend at `http://localhost:3000`
2. Click **Register**
3. Fill out the registration form
4. Submit
5. Check your email for OTP
6. Enter the OTP in the modal
7. Your account is verified! 🎉

## 📝 API Endpoints Ready to Use

-   `POST /api/register` - Register and auto-send OTP
-   `POST /api/send-otp` - Resend OTP
-   `POST /api/verify-otp` - Verify OTP
-   `POST /api/request-login-otp` - Request OTP for login
-   `POST /api/login-with-otp` - Login with OTP

## 🐛 Troubleshooting

### OTP emails not arriving?

1. **Check spam folder** - OTP emails might be filtered
2. **Verify sender email** - Go to [Brevo Senders](https://app.brevo.com/senders) and verify your sender email
3. **Check API key** - Make sure it's correctly copied to `.env`
4. **Check logs** - Look at `storage/logs/laravel.log`

### Test script fails?

```bash
# Make sure you're in the right directory
cd microservices/auth_service

# Check if .env file exists
cat .env | grep BREVO_API_KEY

# If empty or wrong, update it
nano .env  # or use your preferred editor
```

### Can't verify sender email?

On Brevo free tier, you can send emails from any address for testing. The sender verification is only required for production use with high volumes.

## 🎯 Next Steps

Once everything works:

1. **Customize email templates** - Edit `app/Services/BrevoEmailService.php`
2. **Add rate limiting** - Protect against OTP spam
3. **Monitor usage** - Check Brevo dashboard for email stats
4. **Deploy to production** - Update `.env` with production credentials

## 💡 Pro Tips

-   **Free tier limit:** 300 emails/day (perfect for testing)
-   **OTP expiry:** 5 minutes (configurable in `OtpVerification.php`)
-   **OTP length:** 6 digits (secure and user-friendly)
-   **Beautiful emails:** HTML templates with your branding

## 📚 More Documentation

-   **Full Setup Guide:** `BREVO_OTP_SETUP.md`
-   **Implementation Summary:** `../../../OTP_IMPLEMENTATION_SUMMARY.md`
-   **Brevo Docs:** [https://developers.brevo.com/](https://developers.brevo.com/)

## 🆘 Need Help?

1. Check Laravel logs: `tail -f storage/logs/laravel.log`
2. Test Brevo API: `php test-otp-integration.php`
3. Verify database: `php artisan tinker` → `User::all()`
4. Check Brevo dashboard: [https://app.brevo.com/](https://app.brevo.com/)

---

**That's it!** Your OTP system is production-ready. 🚀

Go ahead and test the registration flow. You should receive your OTP within seconds!
