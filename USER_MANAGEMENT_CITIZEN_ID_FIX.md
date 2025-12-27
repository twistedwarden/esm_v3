# User Management - Citizen ID Auto-Generation and SSC Roles Fix

## Overview

Fixed the user management system to auto-generate citizen IDs based on role and added all missing SSC roles including SSC Chairperson.

## Issues Fixed

### 1. Citizen ID Conflict Issue

**Problem:** When creating SSC members (or any user), the system tried to use a citizen ID that was already taken because the field was read-only in the frontend but required by the backend.

**Solution:**

- Changed `citizen_id` validation from `required` to `nullable` in the backend
- Backend now auto-generates `citizen_id` if not provided
- Auto-generation follows pattern: `{PREFIX}-{NUMBER}` where:
  - `CITIZEN-001`, `CITIZEN-002`, etc. for citizens
  - `STAFF-001`, `STAFF-002`, etc. for staff
  - `SSC-001`, `SSC-002`, etc. for all SSC members
  - `ADMIN-001`, `ADMIN-002`, etc. for admins
  - `PSREP-001`, `PSREP-002`, etc. for partner school reps

### 2. Missing SSC Roles

**Problem:** The database only had 3 SSC roles (`ssc_city_council`, `ssc_budget_dept`, `ssc_education_affairs`) but the TypeScript types defined 13 SSC roles.

**Solution:** Added all missing SSC roles including:

- `ssc` (General SSC)
- `ssc_chairperson` ✨ **NEW**
- `ssc_hrd`
- `ssc_social_services`
- `ssc_accounting`
- `ssc_treasurer`
- `ssc_qcydo`
- `ssc_planning_dept`
- `ssc_schools_division`
- `ssc_qcu`

## Changes Made

### Backend Changes

#### 1. Database Migration

**File:** `microservices/auth_service/database/migrations/2025_10_17_100000_add_complete_ssc_roles_to_users_table.php`

- Added all missing SSC roles to the `users` table `role` enum
- Now includes **16 total roles**: admin, citizen, staff, ps_rep, and 12 SSC variations

#### 2. UserController Updates

**File:** `microservices/auth_service/app/Http/Controllers/UserController.php`

**Changes:**

- Updated role validation in `createUser()` and `updateUser()` methods to accept all SSC roles
- Changed `citizen_id` validation from `required` to `nullable`
- Added `generateCitizenId()` private method that:
  - Maps roles to prefixes
  - Finds the highest existing number for that prefix
  - Generates next sequential ID with 3-digit zero-padded number
  - Ensures uniqueness with retry logic
- Auto-generates `citizen_id` during user creation if not provided

### Frontend Changes

#### 1. User State Management

**File:** `GSM/src/admin/components/modules/UserManagement/UserManagement.jsx`

**Changes:**

- Updated `users` state to include arrays for all 12 SSC role types
- Updated `fetchUsers()` to categorize all SSC roles into their respective arrays
- Updated error handling to initialize all SSC role arrays

#### 2. Citizen ID Generation

**Updated `generateNextId()` function:**

- Added all SSC role mappings to `rolePrefix` object
- All SSC roles now map to `SSC` prefix
- Updated `allUsers` array to include all SSC user arrays when searching for existing IDs

#### 3. UI Updates

**Role Selection Dropdowns:**

- Added all 12 SSC role options to both filter dropdown and create/edit form dropdown
- Each option labeled clearly (e.g., "SSC - Chairperson", "SSC - HRD", etc.)

**Badge Colors:**

- Updated `getRoleBadgeColor()` to include unique colors for all SSC roles
- Added dark mode support for all badge colors

**Filter Logic:**

- Updated `filterUsers()` to handle filtering by all SSC roles
- Added role type labels for display (e.g., "SSC - Chairperson")

## Migration Status

✅ **Migration Successful**

The migration `2025_10_17_100000_add_complete_ssc_roles_to_users_table.php` has been successfully applied to the database.

```
2025_10_17_100000_add_complete_ssc_roles_to_users_table ......... DONE
```

## Testing the Fix

### Test Creating SSC Members

1. Go to User Management in the admin dashboard
2. Click "Create New User"
3. Select role (e.g., "SSC - Chairperson")
4. Notice the Citizen ID field is auto-populated as read-only with format `SSC-001`
5. Fill in other required fields
6. Submit the form
7. User should be created successfully with auto-generated citizen ID

### Test Different Role Types

Create users with different roles to verify citizen ID generation:

- **Citizen:** Should generate `CITIZEN-001`, `CITIZEN-002`, etc.
- **Staff:** Should generate `STAFF-001`, `STAFF-002`, etc.
- **Admin:** Should generate `ADMIN-001`, `ADMIN-002`, etc.
- **Partner School Rep:** Should generate `PSREP-001`, `PSREP-002`, etc.
- **SSC Members (all types):** Should generate `SSC-001`, `SSC-002`, etc.

### Verify Role Filtering

1. Use the role filter dropdown
2. Select any SSC role (e.g., "SSC - Chairperson")
3. Only users with that specific role should be displayed

## Key Improvements

1. ✅ **No More Duplicate Citizen ID Errors** - Backend auto-generates unique IDs
2. ✅ **All SSC Roles Available** - Can now create SSC chairperson and all other SSC members
3. ✅ **Consistent ID Format** - All users have properly formatted, sequential citizen IDs
4. ✅ **Better UX** - Frontend clearly shows the auto-generated ID (read-only)
5. ✅ **Proper Role Management** - All roles properly filtered, displayed, and managed

## Rollback Instructions

If needed, rollback the migration:

```bash
cd microservices/auth_service
php artisan migrate:rollback --step=1
```

This will revert the `role` enum to the previous state without the new SSC roles.

## Notes

- All SSC members share the same `SSC` prefix for citizen IDs
- This is intentional to group all SSC committee members together
- The specific role (chairperson, HRD, etc.) is stored in the `role` field
- Frontend automatically triggers ID generation when a role is selected
- Backend ensures uniqueness even in race conditions with retry logic

## Files Modified

### Backend

- `microservices/auth_service/database/migrations/2025_10_17_100000_add_complete_ssc_roles_to_users_table.php` (NEW)
- `microservices/auth_service/app/Http/Controllers/UserController.php`

### Frontend

- `GSM/src/admin/components/modules/UserManagement/UserManagement.jsx`

## Completion Status

✅ All tasks completed successfully!

---

**Date:** October 17, 2025  
**Status:** COMPLETED ✅
