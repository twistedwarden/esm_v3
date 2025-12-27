# Staff Position & Department - Setup Instructions

## Quick Start

Follow these steps to configure and test the staff position and department fix.

## 1. Configure Auth Service

### Add Environment Variable

Create or update the `.env` file in `microservices/auth_service/`:

```env
# Add this line to your .env file
SCHOLARSHIP_SERVICE_URL=http://localhost:8002
```

**Note**: If your scholarship service runs on a different port or URL, update accordingly.

### Restart Auth Service

After updating the `.env` file:

```bash
cd microservices/auth_service
# If using artisan serve
php artisan serve

# Or if using a different method, restart accordingly
```

## 2. Verify Scholarship Service

Ensure the scholarship service is running:

```bash
cd microservices/scholarship_service
php artisan serve --port=8002
```

## 3. Test the Implementation

### Step 1: Create a New Staff User

1. Login to the admin panel with admin credentials
2. Navigate to **User Management**
3. Click **"Add New User"**
4. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Mobile: `09123456789`
   - Password: (create a secure password)
   - **Role**: Select `Staff`
   - **System Role**: Select `Interviewer` (or any other)
   - **Department**: Select from dropdown (e.g., `Scholarship Program`)
   - **Position**: Select from dropdown (e.g., `Interviewer`)
5. Click **Submit**

### Step 2: Verify Database

Check the `staff` table in the scholarship service database:

```sql
-- Connect to scholarship_service database
USE scholarship_service;

-- Check the staff record
SELECT id, user_id, system_role, department, position, is_active
FROM staff
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result**: The `department` and `position` columns should contain the values you selected, NOT NULL.

### Step 3: Test Staff Login

1. Logout from admin account
2. Login with the new staff credentials:
   - Email: `john.doe@example.com`
   - Password: (the one you created)
3. **Expected Behavior**:
   - Should redirect to `/admin` dashboard
   - Should NOT show "Staff Access Required" error

### Step 4: Verify User Data in Browser

1. After logging in as staff, open browser Developer Tools (F12)
2. Go to **Console** tab
3. Type and execute:
   ```javascript
   JSON.parse(localStorage.getItem("user_data"));
   ```
4. **Expected Result**: Should see an object containing:
   ```javascript
   {
     id: "323",
     role: "staff",
     system_role: "interviewer",
     department: "Scholarship Program",
     position: "Interviewer",
     // ... other user fields
   }
   ```

## 4. Troubleshooting

### Issue: "Staff Access Required" Error Still Appears

**Possible Causes:**

1. **Auth service can't reach scholarship service**

   - Check if scholarship service is running on the correct port
   - Verify `SCHOLARSHIP_SERVICE_URL` in auth service `.env`
   - Check auth service logs: `microservices/auth_service/storage/logs/laravel.log`

2. **Staff record not created**

   - Check scholarship service database
   - Verify the user_id exists in both auth and scholarship services

3. **Frontend not receiving system_role**
   - Open Network tab in browser DevTools
   - Find the `/api/user` request
   - Check response - should include `system_role`, `department`, `position`

### Issue: Department/Position Still NULL in Database

**Possible Causes:**

1. **Frontend validation not working**

   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Check browser console for JavaScript errors

2. **Backend not saving values**
   - Check UserController in scholarship service
   - Verify the request payload includes department and position

### Issue: Cannot Select Department or Position

**Possible Causes:**

1. **Frontend code not updated**
   - Ensure `UserManagement.jsx` changes are saved
   - Rebuild frontend: `npm run build` (if in production)
   - Clear browser cache

### Issue: HTTP Request Timeout

If auth service logs show timeout errors:

```
Failed to fetch staff details: Connection timeout
```

**Solutions:**

1. Increase timeout in `AuthController.php`:

   ```php
   $response = \Illuminate\Support\Facades\Http::timeout(10) // Increase from 5 to 10 seconds
       ->get($scholarshipServiceUrl . '/api/staff/user/' . $user->id);
   ```

2. Check network connectivity between services
3. Verify scholarship service is responding:
   ```bash
   curl http://localhost:8002/api/staff/user/1
   ```

## 5. Testing Checklist

- [ ] Auth service `.env` has `SCHOLARSHIP_SERVICE_URL`
- [ ] Both services are running
- [ ] Can create new staff user with department and position
- [ ] Department and position appear as dropdowns (not text inputs)
- [ ] Department and position are marked as required (\*)
- [ ] Cannot submit form without selecting department and position
- [ ] Database shows department and position (not NULL)
- [ ] Staff can login without "Access Required" error
- [ ] User data in localStorage includes system_role, department, position

## 6. Verification Endpoints

### Test Auth Service

```bash
# Get current user (requires authentication token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8000/api/user
```

### Test Scholarship Service

```bash
# Get staff by user_id (replace 323 with actual user_id)
curl http://localhost:8002/api/staff/user/323
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": 6,
    "user_id": 323,
    "citizen_id": "STAFF-002",
    "system_role": "interviewer",
    "department": "Scholarship Program",
    "position": "Interviewer",
    "is_active": true
  },
  "message": "Staff retrieved successfully"
}
```

## 7. Next Steps

After successful testing:

1. **Update existing staff members**:

   - Go to User Management
   - Click edit on existing staff users
   - Select department and position from dropdowns
   - Save changes

2. **Monitor logs** for any integration issues:

   - Auth service: `microservices/auth_service/storage/logs/laravel.log`
   - Scholarship service: `microservices/scholarship_service/storage/logs/laravel.log`

3. **Production deployment**:
   - Update `SCHOLARSHIP_SERVICE_URL` to production URL
   - Test the integration in staging environment first
   - Monitor performance (HTTP request overhead)

## 8. Support

If you encounter issues not covered in this guide:

1. Check the logs in both services
2. Verify database tables and data
3. Test API endpoints directly using curl or Postman
4. Check browser console for JavaScript errors
5. Review `STAFF_POSITION_FIX_SUMMARY.md` for detailed implementation info
