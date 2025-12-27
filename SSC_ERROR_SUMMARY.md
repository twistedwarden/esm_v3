# 🚨 SSC Document Verification Error - Quick Fix

## Error

```
POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/document-verification
500 (Internal Server Error)
```

## What's Wrong?

The database is **missing required tables** for the SSC (Scholarship Selection Committee) multi-stage workflow.

## Quick Diagnosis

Run this command on your server:

```bash
cd microservices/scholarship_service
php check_ssc_tables.php
```

This will tell you exactly what's missing.

## Quick Fix

### Option 1: Run Migrations (Recommended)

```bash
cd microservices/scholarship_service
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
```

### Option 2: Check What's Missing First

```bash
php artisan migrate:status
```

Look for pending migrations related to:

- `create_ssc_reviews_table`
- `update_ssc_reviews_for_parallel_workflow`

## What Gets Created

### New Table: `ssc_reviews`

Stores individual reviews by SSC members for each stage (document verification, financial review, academic review).

### New Columns on `scholarship_applications`

- `ssc_stage_status` (JSON) - Tracks status of each SSC review stage
- `all_required_stages_completed` (boolean) - Whether all stages are done
- `ready_for_final_approval_at` (timestamp) - When ready for chairperson

## After Fix

Test by:

1. Log in as an SSC document verifier
2. Go to an application in "Endorsed to SSC" status
3. Try to approve/reject document verification
4. Should work without 500 error ✅

## Need More Help?

See `SSC_DOCUMENT_VERIFICATION_FIX.md` for:

- Detailed troubleshooting
- Manual SQL commands
- Expected API responses
- Alternative solutions

---

**TL;DR**: Run `php artisan migrate --force` on your production server to fix the 500 error.
