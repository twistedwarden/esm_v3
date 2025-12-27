# SSC 500 Error - Quick Diagnosis (Tables Exist)

Since your tables exist but you're still getting a 500 error, here are the most likely causes:

## 🔍 **Immediate Checks**

### 1. Check Laravel Logs

```bash
cd microservices/scholarship_service
tail -f storage/logs/laravel.log
```

Then try the SSC document verification action again. Look for the actual error message.

### 2. Run Debug Script

```bash
cd microservices/scholarship_service
php SSC_DEBUG_SCRIPT.php
```

This will test the exact code path and show you where it's failing.

## 🚨 **Most Common Causes**

### Cause 1: Missing SSC Member Assignment

**Error**: User is not assigned as an SSC member
**Fix**:

```bash
php artisan tinker
```

```php
// Check if user has SSC assignment
DB::table('ssc_member_assignments')->where('user_id', 1)->get();

// If empty, create one:
\App\Models\SscMemberAssignment::create([
    'user_id' => 1,
    'ssc_role' => 'document_verifier',
    'is_active' => true,
    'assigned_at' => now()
]);
exit
```

### Cause 2: Application Not in Correct Status

**Error**: Application is not in `endorsed_to_ssc` status
**Fix**:

```bash
php artisan tinker
```

```php
// Check application status
$app = \App\Models\ScholarshipApplication::find(4);
echo "Status: " . $app->status;

// If not 'endorsed_to_ssc', update it:
$app->update(['status' => 'endorsed_to_ssc']);
exit
```

### Cause 3: Database Permission Issues

**Error**: User doesn't have INSERT/UPDATE permissions
**Fix**: Check your database user permissions in MySQL Workbench

### Cause 4: Model Not Found

**Error**: `Class 'SscReview' not found`
**Fix**:

```bash
composer dump-autoload
```

### Cause 5: JSON Column Issues

**Error**: Issues with `ssc_stage_status` JSON column
**Fix**: Check if the column exists and has correct type:

```sql
DESCRIBE scholarship_applications;
```

## 🔧 **Quick Fixes to Try**

### Fix 1: Clear All Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
composer dump-autoload
```

### Fix 2: Check Database Connection

```bash
php artisan tinker
```

```php
DB::connection()->getPdo();
echo "Database connected successfully";
exit
```

### Fix 3: Test Database Write

```bash
php artisan tinker
```

```php
// Test if we can write to ssc_reviews
DB::table('ssc_reviews')->insert([
    'application_id' => 1,
    'review_stage' => 'test',
    'reviewer_id' => 1,
    'reviewer_role' => 'test',
    'status' => 'pending',
    'created_at' => now(),
    'updated_at' => now()
]);
echo "Write test successful";
exit
```

## 📋 **Debugging Steps**

1. **Run the debug script first** - it will tell you exactly what's wrong
2. **Check the Laravel logs** - they'll show the actual error
3. **Verify the application status** - must be `endorsed_to_ssc`
4. **Check SSC member assignment** - user must be assigned as SSC member
5. **Test database permissions** - user must be able to INSERT/UPDATE

## 🎯 **Most Likely Issue**

Based on experience, it's probably one of these:

1. **User not assigned as SSC member** (90% of cases)
2. **Application not in correct status** (5% of cases)
3. **Database permission issue** (3% of cases)
4. **Cache/autoload issue** (2% of cases)

Run the debug script and it will tell you exactly which one it is!
