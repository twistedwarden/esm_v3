# MySQL Permissions Fix for Cross-Database Budget Query

## Problem

The scholarship service needs to query budget data from the aid service database (`educ_aid_service`), but the MySQL user `educ_scholarship` doesn't have permission:

```
SQLSTATE[42000]: Syntax error or access violation: 1142 SELECT command denied 
to user 'educ_scholarship'@'localhost' for table 'educ_aid_service'.'budget_allocations'
```

## Solution

Grant the scholarship service MySQL user permission to SELECT from the aid service database.

### Option 1: Grant Specific Table Access (Recommended)

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Grant SELECT permission on budget_allocations table only
GRANT SELECT ON educ_aid_service.budget_allocations TO 'educ_scholarship'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the grant
SHOW GRANTS FOR 'educ_scholarship'@'localhost';
```

### Option 2: Grant Full Database Read Access

If you need to query multiple tables from aid service:

```sql
-- Grant SELECT on entire aid service database
GRANT SELECT ON educ_aid_service.* TO 'educ_scholarship'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3: Use Same MySQL User (Development Only)

For local development, you can use the same MySQL user for both databases:

**In `scholarship_service/.env`:**
```env
DB_USERNAME=root
DB_PASSWORD=your_root_password
```

**⚠️ Not recommended for production!** Each service should have its own database user.

## Verification

After granting permissions, test the sync:

```bash
cd microservices/scholarship_service
php artisan monitoring:sync
```

You should see:
```
✓ Application metrics synced
✓ Financial metrics synced
✓ All data synced successfully!
```

And the dashboard should display **₱2,500,000** as the total budget.

## Production Deployment

For production, add this to your deployment checklist:

1. **Create dedicated MySQL users** for each service
2. **Grant cross-database SELECT permissions** as needed
3. **Use strong passwords** for production database users
4. **Document all cross-database dependencies** in your architecture docs

## Alternative: API-Based Approach

If you prefer not to use cross-database queries, you can create an API endpoint in the aid service:

**Aid Service:** `GET /api/budgets/total?school_year=2026-2027`

**Scholarship Service:** Make HTTP request to fetch budget data

This approach:
- ✅ Better service isolation
- ✅ No database permission issues
- ✅ Easier to scale across servers
- ❌ Slightly slower (HTTP overhead)
- ❌ Requires aid service to be running
