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

If you add a NEW variable to `.env` (like `GEMINI_API_KEY`) **AFTER** the config has been cached:
1. The application **will not see** the new `.env` value.
2. Calls to `env('GEMINI_API_KEY')` will return `null`.
3. Calls to `config('services.gemini.api_key')` will return the *old cached value* (which is null).

## 🔍 Verifying the Fix

1. Watch your logs: `storage/logs/laravel.log`
2. Look for the new log entry we added:
   > `[2024-xx-xx] ... Gemini Service initialized. Model: gemini-pro, Key starts with: AIza...`

If you see "Key starts with: AIza...", the service is correctly reading your key!
