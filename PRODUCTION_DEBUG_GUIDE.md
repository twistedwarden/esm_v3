# Production SSC Error - Debug Guide

## 🎯 **The Issue**

The 500 error is happening in **production**, not in your local development environment. You need to check production logs to see the actual error.

## 📝 **Step 1: Deploy Enhanced Logging**

I've updated the error handling to log more details. Deploy this to production:

```bash
# Commit the changes
git add microservices/scholarship_service/app/Http/Controllers/ScholarshipApplicationController.php
git commit -m "Enhanced error logging for SSC document verification"
git push origin main
```

## 📊 **Step 2: Access Production Logs**

### **If Using Railway:**

```bash
# View live logs
railway logs --service scholarship-service --follow

# Or view recent logs
railway logs --service scholarship-service --tail 100
```

### **If Using SSH:**

```bash
# SSH into production server
ssh your-server

# Navigate to scholarship service
cd /path/to/scholarship_service

# Watch logs in real-time
tail -f storage/logs/laravel.log

# Or view last 100 lines
tail -n 100 storage/logs/laravel.log
```

### **If Using Web Dashboard:**

- Go to your hosting platform's dashboard
- Find "Logs" or "Application Logs"
- Look for errors from the scholarship service

## 🔍 **Step 3: Reproduce the Error**

1. Open production app in browser
2. Log in as SSC member
3. Try to approve document verification
4. Watch the logs - you'll see detailed error info

## 🎯 **Step 4: What to Look For**

The enhanced logging will show:

```
Failed to submit document verification
- exception: [The actual error message]
- exception_trace: [Full stack trace]
- application_id: 4
- application_status: endorsed_to_ssc
- reviewer_id: 123
- request_data: {...}
- file: /path/to/file.php
- line: 742
```

## 🚨 **Common Production Issues**

### Issue 1: SSC Member Assignment Missing

**Log will show**: "Call to a member function on null"
**Fix**: Assign SSC role to the user in production database

```sql
INSERT INTO ssc_member_assignments (user_id, ssc_role, is_active, assigned_at, created_at, updated_at)
VALUES (123, 'document_verifier', 1, NOW(), NOW(), NOW());
```

### Issue 2: Application Not Found

**Log will show**: "No query results for model [ScholarshipApplication]"
**Fix**: Check if application ID 4 exists in production database

### Issue 3: Database Column Missing

**Log will show**: "Column not found: ssc_stage_status"
**Fix**: Run migrations on production

```bash
php artisan migrate --force
```

### Issue 4: JSON Column Issue

**Log will show**: "Invalid JSON"
**Fix**: Check ssc_stage_status column type

```sql
SHOW COLUMNS FROM scholarship_applications WHERE Field = 'ssc_stage_status';
```

## 🔧 **Quick Production Fixes**

### Check Application Status:

```bash
# On production server
php artisan tinker
```

```php
$app = \App\Models\ScholarshipApplication::find(4);
echo "Status: " . $app->status . "\n";
echo "SSC Stage Status: " . json_encode($app->ssc_stage_status) . "\n";
exit
```

### Check SSC Assignments:

```php
$assignments = \App\Models\SscMemberAssignment::where('is_active', true)->get();
foreach ($assignments as $a) {
    echo "User {$a->user_id}: {$a->ssc_role}\n";
}
exit
```

### Test Approval Manually:

```php
$app = \App\Models\ScholarshipApplication::find(4);
$result = $app->approveStage('document_verification', 1, 'Test', []);
echo $result ? "Success" : "Failed";
exit
```

## 📋 **After You Find the Error**

Once you see the actual error in the logs:

1. **Copy the error message** and stack trace
2. **Share it** - I can help you fix the specific issue
3. **Apply the fix** to production
4. **Test again**

## 🎓 **Understanding the Error Response**

When you get a 500 error, check:

1. **Browser Console** - Shows "Server error (500): [message]"
2. **Network Tab** - Shows response body with error details
3. **Production Logs** - Shows full error with stack trace

All three together will tell you exactly what's wrong!

---

**TL;DR**:

1. Deploy the enhanced logging
2. Check production logs (Railway/SSH)
3. Try the action again
4. Copy the error message
5. Fix the specific issue
