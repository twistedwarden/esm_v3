# User Creation Error Fix

## Problem

When trying to create users with SSC roles (like `ssc_city_council`, `ssc_budget_dept`, `ssc_education_affairs`), you're getting a 500 error because the database's role enum doesn't include these values.

## Root Cause

The `users` table in the auth service database has a `role` column defined as an ENUM. The production database hasn't run the latest migrations that add the SSC roles to this enum.

## Solution

### Step 1: Run Migrations on Railway

You need to run the migrations on your Railway deployment of the auth service. Here are the options:

#### Option A: Via Railway CLI (Recommended)

1. Install Railway CLI if you haven't:

```bash
npm install -g @railway/cli
```

2. Login to Railway:

```bash
railway login
```

3. Link to your project:

```bash
cd microservices/auth_service
railway link
```

4. Run the migrations:

```bash
railway run php artisan migrate
```

#### Option B: Via Railway Dashboard

1. Go to your Railway dashboard: https://railway.app/
2. Open your auth service project
3. Go to the "Settings" tab
4. Under "Deploy", add a deploy command or use the web terminal
5. Run: `php artisan migrate`

#### Option C: Direct Database Query

If you have access to the Railway database console:

```sql
ALTER TABLE users MODIFY COLUMN role ENUM(
  'admin',
  'citizen',
  'staff',
  'ps_rep',
  'ssc',
  'ssc_city_council',
  'ssc_budget_dept',
  'ssc_education_affairs'
) DEFAULT 'citizen';
```

### Step 2: Verify the Fix

After running the migrations, try creating a user with role `ssc_city_council` again. The error should be resolved.

### Step 3: Check Logs (Optional)

The improved error handling now provides better logging. Check the Laravel logs to see detailed error messages:

**In Railway Dashboard:**

- Go to your auth service
- Click on "Deployments"
- Select the latest deployment
- Click "View Logs"

Look for entries starting with:

- `Creating user with data:`
- `Validation passed, creating user`
- Or error messages like `User creation validation failed` or `Database error creating user`

## What Was Changed

### 1. Auth Service Error Handling

**File:** `microservices/auth_service/app/Http/Controllers/UserController.php`

Added better error handling in the `createUser` method:

- Separate handling for validation errors (422)
- Separate handling for database errors (500)
- Better error messages for duplicate entries
- Detailed logging at each step

### 2. Scholarship Service Error Handling

**File:** `microservices/scholarship_service/app/Http/Controllers/Api/UserManagementController.php`

Improved error message passing:

- Now passes through the actual error message from auth service
- Includes validation errors from auth service
- Provides more detailed error information

### 3. Database Migration

**File:** `microservices/auth_service/database/migrations/2025_10_17_094340_add_all_ssc_roles_to_users_table.php`

Updated to ensure all SSC roles are included in the role enum.

## Testing

After fixing, test with this curl command (replace the URL and token):

```bash
curl -X POST https://scholarship-gsph.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "citizen_id": "TEST-SSC-001",
    "email": "test-ssc@example.com",
    "password": "SecurePassword123",
    "first_name": "Test",
    "last_name": "SSC",
    "mobile": "09123456789",
    "role": "ssc_city_council"
  }'
```

## Additional Notes

- The error handling improvements will now provide clearer error messages for future issues
- All SSC roles are now supported: `ssc`, `ssc_city_council`, `ssc_budget_dept`, `ssc_education_affairs`
- If you encounter "duplicate entry" errors, it means a user with that citizen_id or email already exists

## Troubleshooting

### If migrations fail:

1. Check the database connection in Railway
2. Ensure the auth service is properly connected to the database
3. Check for any pending migrations: `php artisan migrate:status`

### If errors persist:

1. Check the Laravel logs in Railway for detailed error messages
2. Verify the database schema: The `role` column should be an ENUM with all 8 values
3. Try creating a test user with a simpler role like `citizen` to isolate the issue
