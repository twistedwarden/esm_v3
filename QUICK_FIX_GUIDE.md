# 🚀 Quick Fix Guide - User Creation Error

## The Problem

You're getting a 500 error when creating users with SSC roles because the database doesn't have those roles in its allowed values.

## The Solution (Choose One)

### ⚡ FASTEST - Direct SQL (2 minutes)

1. Open Railway Dashboard → Your Auth Service Database
2. Open the Query console
3. Paste and run:

```sql
ALTER TABLE users MODIFY COLUMN role ENUM(
  'admin', 'citizen', 'staff', 'ps_rep', 'ssc',
  'ssc_city_council', 'ssc_budget_dept', 'ssc_education_affairs'
) DEFAULT 'citizen';
```

4. Done! ✅

### 🔧 RECOMMENDED - Run Script (5 minutes)

**Windows:**

```bash
run-auth-migrations.bat
```

**Mac/Linux:**

```bash
chmod +x run-auth-migrations.sh
./run-auth-migrations.sh
```

### 📝 MANUAL - Railway CLI (3 minutes)

```bash
cd microservices/auth_service
railway login
railway link
railway run php artisan migrate --force
```

## Verify It Worked

Try creating a user with role `ssc_city_council` - it should work now!

## What If It Still Doesn't Work?

1. Check Railway logs for detailed error messages
2. Verify the SQL change: `SHOW COLUMNS FROM users WHERE Field = 'role';`
3. See **USER_CREATION_FIX.md** for full troubleshooting guide

---

**That's it!** The code changes are already done, you just need to update the database.
