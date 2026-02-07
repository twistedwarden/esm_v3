# Troubleshooting Gemini AI Insights "Service Not Configured"

If you are seeing **"Service Not Configured"** in production despite having `GEMINI_API_KEY` in your `.env` file, it is almost certainly a **Configuration Caching** issue.

## 🚀 The Quick Fix

Run these commands in your production environment (Railway, Terminal, etc.):

```bash
cd microservices/scholarship_service

# 1. Clear the configuration cache
php artisan config:clear

# 2. Re-cache the configuration (optional but recommended for speed)
php artisan config:cache

# 3. Restart the queue worker (if applicable)
php artisan queue:restart
```

## ❓ Why does this happen?

In Laravel production environments, we often run `php artisan config:cache` to speed up the application. This combines all config files (`config/*.php`) into one file.

**Note:** We have updated the code to also look for `AI_API_KEY` and `AI_MODEL` in your `.env` file if `GEMINI_API_KEY` is missing.

If you add a NEW variable to `.env` (like `GEMINI_API_KEY`) **AFTER** the config has been cached:
1. The application **will not see** the new `.env` value.
2. Calls to `env('GEMINI_API_KEY')` will return `null`.
3. Calls to `config('services.gemini.api_key')` will return the *old cached value* (which is null).

## 🔍 Verifying the Fix

1. Watch your logs: `storage/logs/laravel.log`
2. Look for the new log entry we added:
   > `[2024-xx-xx] ... Gemini Service initialized. Model: gemini-pro, Key starts with: AIza...`

If you see "Key starts with: AIza...", the service is correctly reading your key!

## 🐛 Interpreting Error Messages in UI

We have updated the system to show detailed errors directly in the "Key Findings" section if generation fails.

- **"Service Not Configured"**:
  - Means `GEMINI_API_KEY` is completely missing or empty.
  - **Fix**: Check `.env` and run `php artisan config:clear`.

- **"AI Generation Failed (400)"**:
  - **Error: INVALID_ARGUMENT**: Usually means the API key is invalid.
  - **Error: API key not valid**: Your key is definitely wrong.

- **"AI Generation Failed (429)"**:
  - **Error: Quota exceeded**: You have hit the rate limit for the free tier.
  - **Fix**: Wait a few minutes or switch to a paid plan/different key.

- **"Unexpected Response Format"**:
  - The AI generated content but it wasn't valid JSON.
  - **Fix**: Try generating again. It might be a one-off glitch.
