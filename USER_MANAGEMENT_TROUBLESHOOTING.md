# User Management Troubleshooting Guide

## Issue: No Users Showing in Dashboard

If you're seeing an empty user management dashboard, follow these steps to diagnose and fix the issue:

### Step 1: Check if Services are Running

1. **Auth Service (Port 8001):**
   ```bash
   # Check if auth service is running
   curl http://localhost:8001/api/users
   # Should return JSON with users data
   ```

2. **Scholarship Service (Port 8000):**
   ```bash
   # Check if scholarship service is running
   curl http://localhost:8000/api/test/users
   # Should return test data with auth service connection info
   ```

### Step 2: Run the Setup Script

**For Windows (PowerShell):**
```powershell
.\setup_users.ps1
```

**For Linux/Mac:**
```bash
./setup_users.sh
```

This script will:
- Run database migrations
- Seed sample users
- Test API connections

### Step 3: Manual Database Setup

If the script doesn't work, run these commands manually:

**1. Setup Auth Service:**
```bash
cd microservices/auth_service
php artisan migrate --force
php artisan db:seed --class=UserSeeder
```

**2. Setup Scholarship Service:**
```bash
cd microservices/scholarship_service
php artisan migrate --force
php artisan db:seed --class=UserManagementSeeder
```

### Step 4: Check Database Configuration

**Auth Service (.env):**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=auth_service
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

**Scholarship Service (.env):**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scholarship_service
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Step 5: Check Service URLs

**Scholarship Service (.env):**
```env
AUTH_SERVICE_URL=http://localhost:8001
```

**Frontend (.env):**
```env
VITE_SCHOLARSHIP_API_URL=http://localhost:8000/api
```

### Step 6: Debug Frontend

1. Open browser developer tools (F12)
2. Go to Console tab
3. Navigate to User Management page
4. Look for debug information in the yellow box
5. Check console logs for API calls

### Step 7: Test API Endpoints Directly

**Test Auth Service:**
```bash
curl -X GET "http://localhost:8001/api/users" \
  -H "Accept: application/json"
```

**Test Scholarship Service:**
```bash
curl -X GET "http://localhost:8000/api/test/users" \
  -H "Accept: application/json"
```

**Test User Management (with auth):**
```bash
curl -X GET "http://localhost:8000/api/users" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 8: Check Logs

**Auth Service Logs:**
```bash
cd microservices/auth_service
tail -f storage/logs/laravel.log
```

**Scholarship Service Logs:**
```bash
cd microservices/scholarship_service
tail -f storage/logs/laravel.log
```

### Step 9: Verify Sample Users

After running the seeders, you should have these users:

**Admin Users:**
- Email: admin@caloocan.gov.ph
- Password: admin123
- Role: admin

**Staff Users:**
- Email: staff@caloocan.gov.ph
- Password: staff123
- Role: staff

**Citizen Users:**
- Email: citizen@example.com
- Password: citizen123
- Role: citizen

**Partner School Rep:**
- Email: school.rep@university.edu.ph
- Password: psrep123
- Role: ps_rep

### Step 10: Common Issues and Solutions

#### Issue: "Cannot read properties of undefined"
**Solution:** The frontend is trying to access user arrays before they're loaded. This should be fixed with the updated code.

#### Issue: "Failed to fetch users from auth service"
**Solution:** 
1. Check if auth service is running on port 8001
2. Verify AUTH_SERVICE_URL in scholarship service .env
3. Check network connectivity between services

#### Issue: "No users found" in database
**Solution:**
1. Run the user seeder: `php artisan db:seed --class=UserSeeder`
2. Check if database connection is working
3. Verify table structure with migrations

#### Issue: CORS errors
**Solution:**
1. Check CORS configuration in both services
2. Ensure frontend is making requests to correct URLs
3. Check if services are running on expected ports

#### Issue: Authentication errors
**Solution:**
1. Check if you're logged in as admin
2. Verify auth middleware is working
3. Check token validity

### Step 11: Manual User Creation

If you still don't see users, try creating one manually through the API:

```bash
curl -X POST "http://localhost:8001/api/users" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "citizen_id": "TEST-001",
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "citizen"
  }'
```

### Step 12: Reset Everything

If nothing works, reset the databases:

```bash
# Auth Service
cd microservices/auth_service
php artisan migrate:fresh --seed

# Scholarship Service
cd microservices/scholarship_service
php artisan migrate:fresh --seed
```

### Debug Information

The frontend now includes debug information that shows:
- API URL being used
- Raw users data from API
- Filtered users count
- Loading state

This information will help identify where the issue is occurring.

### Still Having Issues?

1. Check the browser console for JavaScript errors
2. Check the network tab for failed API requests
3. Verify all environment variables are set correctly
4. Ensure all services are running on the correct ports
5. Check database permissions and connectivity

### Sample Data Verification

After setup, you should see:
- 1 Admin user
- 3 Staff users (with Staff records)
- 3 Citizen users
- 1 Partner School Representative

Total: 8 users across all categories.
