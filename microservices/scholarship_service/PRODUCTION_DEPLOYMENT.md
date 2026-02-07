# Production Deployment Guide - Budget Fix

## Overview
This guide covers deploying the cross-database budget query fix to production.

## Changes Summary

### 1. Database Configuration
Added aid service database connection to `config/database.php`:
```php
'aid' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_AID_DATABASE', 'aid_service'),
    'username' => env('DB_AID_USERNAME', env('DB_USERNAME', 'root')),
    'password' => env('DB_AID_PASSWORD', env('DB_PASSWORD', '')),
    // ... other settings
],
```

### 2. Environment Variables
Added to `.env`:
```env
# Aid Service Database (for cross-database budget queries)
DB_AID_DATABASE=educ_aid_service
DB_AID_USERNAME=educ_aid
DB_AID_PASSWORD=your_aid_password
```

### 3. Budget Query Update
Changed from hardcoded to dynamic query in `SyncMonitoringData.php`:
```php
// Queries aid_service.budget_allocations table
$aidDbName = config('database.connections.aid.database', 'aid_service');
$totalBudget = DB::table($aidDbName . '.budget_allocations')
    ->where('school_year', $schoolYear)
    ->sum('total_budget') ?? 0;
```

## Production Deployment Steps

### 1. Update Production Environment Variables

SSH into your production server and update the scholarship service `.env`:

```bash
# Add these lines to /path/to/scholarship_service/.env
DB_AID_DATABASE=educ_aid_service
DB_AID_USERNAME=educ_aid
DB_AID_PASSWORD=your_production_password
```

> **Note:** Use the actual credentials that have SELECT permission on `educ_aid_service.budget_allocations`

### 2. Deploy Code Changes

```bash
cd /path/to/your/app
git pull origin main
```

### 3. Clear Laravel Caches

```bash
cd microservices/scholarship_service
php artisan config:clear
php artisan cache:clear
```

### 4. Test the Sync

```bash
php artisan monitoring:sync
```

**Expected Output:**
```
Syncing data for snapshot date: 2026-02-07
Aggregating application metrics...
✓ Application metrics synced
Aggregating financial metrics...
✓ Financial metrics synced
All data synced successfully!
```

### 5. Verify Dashboard

Open the monitoring dashboard and check:
- ✅ **Budget Utilized** shows 0% 
- ✅ **Remaining budget** shows **₱2,500,000** (or your actual total)
- ✅ **Approval Rate** shows correct percentage
- ✅ **Application Pipeline** shows counts

## Troubleshooting

### Error: "Access denied for user"
```
SQLSTATE[HY000] [1045] Access denied for user 'educ_scholarship'@'localhost'
```

**Solution:** The credentials in `.env` are incorrect. Verify:
1. `DB_AID_USERNAME` matches the MySQL user
2. `DB_AID_PASSWORD` is correct
3. User has SELECT permission on `educ_aid_service.budget_allocations`

### Error: "Table doesn't exist"
```
SQLSTATE[42S02]: Base table or view not found: 1146 Table 'educ_aid_service.budget_allocations' doesn't exist
```

**Solution:** Check `DB_AID_DATABASE` value:
- Production: `educ_aid_service`
- Local: `aid_service`

### Error: "No connection could be made"
```
SQLSTATE[HY000] [2002] No connection could be made
```

**Solution:** MySQL is not running. Start the MySQL service.

## Rollback Plan

If issues occur, you can temporarily revert to the old behavior:

1. **Quick Fix:** Use a fallback value in production
   ```php
   // In SyncMonitoringData.php, temporarily add:
   $totalBudget = $totalBudget ?: 2500000; // Fallback to known value
   ```

2. **Full Rollback:**
   ```bash
   git revert HEAD
   php artisan config:clear
   ```

## Verification Checklist

- [ ] Environment variables added to production `.env`
- [ ] Code deployed via `git pull`
- [ ] Config cache cleared
- [ ] `monitoring:sync` runs without errors
- [ ] Dashboard shows correct budget (₱2.5M)
- [ ] Approval rate displays correctly
- [ ] Application pipeline shows data
- [ ] Real-time updates work (if WebSocket configured)

## Notes

- The aid service user (`educ_aid`) must have SELECT permission on `budget_allocations` table
- Both databases must be on the same MySQL server for cross-database queries to work
- If databases are on separate servers, you'll need to implement an API-based approach instead
