# Staff Position and Department Fix - Implementation Summary

## Problem

When creating staff users in the user management system, the `department` and `position` fields were:

1. Not being saved (showing NULL in database)
2. Not being returned in the authentication response
3. Causing "Staff Access Required" error when staff tried to access the admin dashboard

## Root Causes

1. **Frontend**: Text input fields allowed empty values to be submitted
2. **Backend**: No validation requiring these fields
3. **Authentication**: Auth service `/user` endpoint didn't fetch `system_role`, `department`, or `position` from the scholarship service's `staff` table

## Solutions Implemented

### 1. Frontend Changes (UserManagement.jsx)

#### Converted Text Inputs to Dropdowns

- **Department Field**: Now a dropdown with 13 predefined options:

  - Information Technology
  - Human Resources
  - Finance
  - Education Affairs
  - Student Services
  - Administration
  - Budget Department
  - City Council
  - Scholarship Program
  - Assessment & Evaluation
  - Community Relations
  - Legal Affairs
  - Planning & Development

- **Position Field**: Now a dropdown with 20 predefined options:
  - Interviewer, Assessment Officer, Evaluation Specialist
  - Reviewer, Assessment Coordinator, Evaluation Manager
  - Administrator, System Administrator, IT Administrator
  - Coordinator, Program Coordinator, Scholarship Coordinator
  - Department Head, Manager, Supervisor
  - Officer, Specialist, Analyst, Assistant, Clerk

#### Enhanced Validation

```javascript
// Department validation for staff - required field
if (formData.role === "staff") {
  if (!formData.department || formData.department.trim() === "") {
    errors.department = "Department is required for staff members";
  } else if (formData.department.length > 100) {
    errors.department = "Department name must be less than 100 characters";
  }
}

// Position validation for staff - required field
if (formData.role === "staff") {
  if (!formData.position || formData.position.trim() === "") {
    errors.position = "Position is required for staff members";
  } else if (formData.position.length > 100) {
    errors.position = "Position must be less than 100 characters";
  }
}
```

#### Form Updates

- Added asterisk (\*) to both Department and Position labels
- Added `required` attribute to dropdown elements
- Updated both Create User and Edit User modals

### 2. Backend Changes

#### Auth Service (AuthController.php)

Updated the `/user` endpoint to fetch staff details from scholarship service:

```php
// If user is staff, fetch their staff details from scholarship service
if ($user->role === 'staff') {
    try {
        $scholarshipServiceUrl = env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8002');

        $response = \Illuminate\Support\Facades\Http::timeout(5)
            ->get($scholarshipServiceUrl . '/api/staff/user/' . $user->id);

        if ($response->successful()) {
            $staffData = $response->json();

            if (isset($staffData['success']) && $staffData['success'] && isset($staffData['data'])) {
                $userData['system_role'] = $staffData['data']['system_role'] ?? null;
                $userData['department'] = $staffData['data']['department'] ?? null;
                $userData['position'] = $staffData['data']['position'] ?? null;
            }
        }
    } catch (\Exception $e) {
        \Log::warning('Failed to fetch staff details: ' . $e->getMessage());
        // Continue without staff details - frontend will handle missing system_role
    }
}
```

#### Scholarship Service (routes/api.php)

Added new public route to fetch staff details by user_id:

```php
// Staff endpoints for auth service to fetch staff details
Route::get('/staff/user/{userId}', [StaffController::class, 'getStaffByUserId']);
```

**Note**: The `getStaffByUserId` method already existed in `StaffController.php` (lines 201-234), which returns:

- `system_role`
- `department`
- `position`
- `is_active`
- Other staff fields

### 3. Configuration Required

#### Auth Service .env

Add or update the following environment variable:

```env
SCHOLARSHIP_SERVICE_URL=http://localhost:8002
```

For production/deployed environments, update this to the actual scholarship service URL.

## Data Flow

1. **User Login**:

   - User authenticates with auth service
   - Auth service validates credentials and generates token

2. **Fetch User Data**:

   - Frontend calls `/api/user` endpoint
   - Auth service checks if user role is 'staff'
   - If staff, makes HTTP request to scholarship service: `/api/staff/user/{userId}`
   - Scholarship service returns staff details (system_role, department, position)
   - Auth service includes staff details in response

3. **Frontend Authorization**:
   - Frontend receives user data with `system_role`
   - `App.tsx` checks for `currentUser.system_role` (line 51)
   - If present, grants access to admin dashboard
   - If missing, shows "Staff Access Required" error

## Testing Steps

1. **Create a new staff user**:

   - Go to User Management
   - Click "Add New User"
   - Fill in user details
   - Select role as "Staff"
   - Select System Role (e.g., "Interviewer")
   - **Select Department** from dropdown (required)
   - **Select Position** from dropdown (required)
   - Submit

2. **Verify in database**:

   - Check `staff` table in scholarship service database
   - Confirm `department` and `position` are not NULL

3. **Test login**:

   - Login with the new staff credentials
   - Should be redirected to admin dashboard (no "Staff Access Required" error)

4. **Verify user data**:
   - In browser console, check localStorage for 'user_data'
   - Should contain `system_role`, `department`, and `position`

## Files Modified

### Frontend

- `GSM/src/admin/components/modules/UserManagement/UserManagement.jsx`

### Backend

- `microservices/auth_service/app/Http/Controllers/AuthController.php`
- `microservices/scholarship_service/routes/api.php`

## Benefits

1. **Data Integrity**: Prevents NULL values in department and position fields
2. **Better UX**: Dropdowns provide clear, standardized options
3. **Validation**: Required fields prevent incomplete staff records
4. **Authentication**: Staff users can now access admin dashboard
5. **Maintainability**: Easy to add/remove dropdown options in the future
6. **Scalability**: Auth service properly integrates with scholarship service

## Known Limitations

1. **HTTP Request Overhead**: Each `/user` call for staff makes additional HTTP request to scholarship service
2. **Timeout Handling**: If scholarship service is down, staff details won't be available (graceful degradation)
3. **Caching**: No caching implemented - could be added for performance optimization
4. **Error Handling**: If scholarship service is unavailable, staff might get "Access Required" error

## Future Enhancements

1. **Caching**: Implement Redis/Memcached for staff details to reduce HTTP calls
2. **Database Replication**: Consider replicating staff table to auth service for better performance
3. **Custom Positions**: Add "Other" option with text input for non-standard positions
4. **Department Hierarchy**: Implement department structure with parent-child relationships
5. **Role-Based Permissions**: Different system_roles could have different department/position options
