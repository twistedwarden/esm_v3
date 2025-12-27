# School Assignment Setup Guide

## Issue
The error `no such table: schools` occurs because the auth service is trying to validate against a schools table that doesn't exist in its database. The schools table is in the scholarship service.

## Solution

### 1. Run the Migration
The `assigned_school_id` column needs to be added to the users table in the auth service.

**Option A: Using Laravel Migration**
```bash
cd microservices/auth_service
php artisan migrate
```

**Option B: Manual SQL (if migration fails)**
```sql
ALTER TABLE users ADD COLUMN assigned_school_id INTEGER NULL;
```

### 2. Restart Services
After running the migration, restart both services:
```bash
# Restart auth service
cd microservices/auth_service
php artisan serve --port=8000

# Restart scholarship service  
cd microservices/scholarship_service
php artisan serve --port=8001
```

### 3. Verify Setup
1. Check that the `assigned_school_id` column exists in the users table
2. Test school assignment in the admin panel
3. Verify PS rep login shows assigned school

## Changes Made

### Backend Changes
1. **Migration**: Added `assigned_school_id` column to users table (without foreign key constraint)
2. **UserController**: Updated to validate school existence via scholarship service API call
3. **User Model**: Updated to handle assigned school ID without direct relationship

### Frontend Changes
1. **SchoolAssignmentModal**: Modal for assigning schools to PS reps
2. **UserManagement**: Added school assignment button and display
3. **PartnerSchoolService**: Updated to fetch assigned school data

## API Endpoints
- `PUT /api/users/{id}/assign-school` - Assign school to PS rep
- `PUT /api/users/{id}/unassign-school` - Remove school assignment

## How It Works
1. Admin selects a PS rep and clicks the school assignment button
2. Modal shows available schools from scholarship service
3. Admin selects a school and confirms assignment
4. Auth service validates school exists via scholarship service API
5. School ID is stored in users table
6. When PS rep logs in, their assigned school data is fetched and displayed

## Troubleshooting
- If migration fails, use the manual SQL approach
- Ensure both services are running on correct ports
- Check that scholarship service has schools data
- Verify API endpoints are accessible between services
