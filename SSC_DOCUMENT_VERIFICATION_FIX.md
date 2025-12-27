# SSC Document Verification - 500 Error Fix

## Problem Summary

When SSC members try to approve/reject document verification, the system returns:

```
POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/document-verification
500 (Internal Server Error)
```

## Root Cause

The **500 error** is caused by missing database tables required for the SSC multi-stage workflow:

1. **Missing Table**: `ssc_reviews` - Stores individual stage reviews by SSC members
2. **Missing Column**: `ssc_stage_status` (JSON) on `scholarship_applications` table
3. **Missing Column**: `all_required_stages_completed` (boolean) on `scholarship_applications` table

The backend code tries to insert/update records in these tables, but if they don't exist, it causes a database error and returns 500.

## Solution

Run the missing migrations on your production database.

### Step 1: Check if Migrations are Needed

SSH into your scholarship service and check:

```bash
cd microservices/scholarship_service
php artisan migrate:status
```

Look for these migrations that should be run:

- `2025_01_16_000008_create_ssc_reviews_table.php`
- `2025_10_14_081011_update_ssc_reviews_for_parallel_workflow.php`
- Any migration that adds `ssc_stage_status` column

### Step 2: Run Missing Migrations

If migrations are pending:

```bash
php artisan migrate --force
```

**Note**: The `--force` flag is needed in production to bypass the confirmation prompt.

### Step 3: Verify Tables Exist

Check that the tables were created:

```bash
php artisan tinker
```

Then run:

```php
Schema::hasTable('ssc_reviews'); // Should return true
Schema::hasColumn('scholarship_applications', 'ssc_stage_status'); // Should return true
Schema::hasColumn('scholarship_applications', 'all_required_stages_completed'); // Should return true
exit
```

### Step 4: Clear Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Step 5: Test the Fix

1. Log in as an SSC member
2. Navigate to document verification review
3. Try to approve/reject a document
4. Should now work without 500 error

## Migration Files

### Required Migration 1: `create_ssc_reviews_table.php`

Creates the `ssc_reviews` table to store individual stage reviews:

```php
Schema::create('ssc_reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
    $table->string('review_stage'); // 'document_verification', 'financial_review', 'academic_review'
    $table->unsignedBigInteger('reviewer_id');
    $table->string('reviewer_role'); // 'document_verifier', 'financial_analyst', etc.
    $table->enum('status', ['pending', 'approved', 'rejected', 'needs_revision'])->default('pending');
    $table->text('review_notes')->nullable();
    $table->json('review_data')->nullable();
    $table->timestamp('reviewed_at')->nullable();
    $table->timestamps();
});
```

### Required Migration 2: `update_ssc_reviews_for_parallel_workflow.php`

Adds columns to `scholarship_applications` for parallel workflow:

```php
Schema::table('scholarship_applications', function (Blueprint $table) {
    $table->json('ssc_stage_status')->nullable()->after('status');
    $table->boolean('all_required_stages_completed')->default(false)->after('ssc_stage_status');
    $table->timestamp('ready_for_final_approval_at')->nullable();
});
```

## Expected API Behavior After Fix

### Successful Document Verification Approval

**Request:**

```http
POST /api/applications/4/ssc/document-verification
Content-Type: application/json
Authorization: Bearer <token>

{
  "verified": true,
  "notes": "All documents are complete and verified",
  "document_issues": []
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Document verification stage approved successfully.",
  "data": {
    "id": 4,
    "status": "endorsed_to_ssc",
    "ssc_stage_status": {
      "document_verification": {
        "status": "approved",
        "reviewed_by": 123,
        "reviewed_at": "2025-10-18T12:34:56.000000Z",
        "notes": "All documents are complete and verified"
      }
    },
    "all_required_stages_completed": false
  }
}
```

### Document Verification Rejection

**Request:**

```http
POST /api/applications/4/ssc/document-verification
Content-Type: application/json
Authorization: Bearer <token>

{
  "verified": false,
  "notes": "Missing certificate of indigency",
  "document_issues": ["Certificate of Indigency"]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Document verification stage marked as needing revision.",
  "data": {
    "id": 4,
    "status": "endorsed_to_ssc",
    "ssc_stage_status": {
      "document_verification": {
        "status": "rejected",
        "reviewed_by": 123,
        "reviewed_at": "2025-10-18T12:34:56.000000Z",
        "notes": "Missing certificate of indigency",
        "document_issues": ["Certificate of Indigency"]
      }
    }
  }
}
```

## Troubleshooting

### Issue 1: Migration fails with "table already exists"

**Solution**: The table might already exist. Check manually:

```bash
php artisan tinker
DB::table('ssc_reviews')->count();
```

If it exists, mark the migration as run:

```bash
php artisan migrate:status
# Find the migration name that's failing
php artisan db
# Manually insert into migrations table
```

### Issue 2: Column already exists error

**Solution**: The column might be there already. Skip that specific migration or modify it to check:

```php
if (!Schema::hasColumn('scholarship_applications', 'ssc_stage_status')) {
    $table->json('ssc_stage_status')->nullable();
}
```

### Issue 3: Still getting 500 error after migration

**Solution**: Check Laravel logs:

```bash
tail -f storage/logs/laravel.log
```

Look for the actual database error and address it specifically.

### Issue 4: "SscReview model not found"

**Solution**: Run composer autoload:

```bash
composer dump-autoload
```

## Database Schema

After all migrations, your database should have:

### Table: `ssc_reviews`

| Column         | Type      | Description                              |
| -------------- | --------- | ---------------------------------------- |
| id             | bigint    | Primary key                              |
| application_id | bigint    | FK to scholarship_applications           |
| review_stage   | varchar   | Stage name (document_verification, etc.) |
| reviewer_id    | bigint    | ID of SSC member                         |
| reviewer_role  | varchar   | Role of reviewer                         |
| status         | enum      | pending/approved/rejected/needs_revision |
| review_notes   | text      | Review comments                          |
| review_data    | json      | Additional review data                   |
| reviewed_at    | timestamp | When reviewed                            |
| created_at     | timestamp |                                          |
| updated_at     | timestamp |                                          |

### Table: `scholarship_applications` (updated columns)

| Column                        | Type      | Description                 |
| ----------------------------- | --------- | --------------------------- |
| ssc_stage_status              | json      | Status of each SSC stage    |
| all_required_stages_completed | boolean   | Whether all stages are done |
| ready_for_final_approval_at   | timestamp | When ready for chairperson  |

## Alternative: Manual Database Fix

If you can't run migrations, manually create the table:

```sql
CREATE TABLE `ssc_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `application_id` bigint(20) UNSIGNED NOT NULL,
  `review_stage` varchar(255) NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_role` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected','needs_revision') DEFAULT 'pending',
  `review_notes` text DEFAULT NULL,
  `review_data` json DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ssc_reviews_application_id_foreign` (`application_id`),
  CONSTRAINT `ssc_reviews_application_id_foreign` FOREIGN KEY (`application_id`) REFERENCES `scholarship_applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `scholarship_applications`
ADD COLUMN `ssc_stage_status` json DEFAULT NULL AFTER `status`,
ADD COLUMN `all_required_stages_completed` tinyint(1) DEFAULT 0 AFTER `ssc_stage_status`,
ADD COLUMN `ready_for_final_approval_at` timestamp NULL DEFAULT NULL;
```

---

**Status**: ⚠️ **DATABASE MIGRATION REQUIRED**
**Priority**: **HIGH** - Blocking SSC workflow
**Last Updated**: October 18, 2025
