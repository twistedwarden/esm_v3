# User Management System

## Overview
The User Management system provides comprehensive administration capabilities for managing all users in the GovServe PH system. This module ensures proper role separation and maintains citizen records separately from other user roles.

## Features

### 1. User Roles
The system supports four distinct user roles:
- **Citizens**: Regular users who apply for scholarships and benefits
- **Staff**: System employees with various operational roles (interviewer, reviewer, administrator, coordinator)
- **Administrators**: System admins with full access
- **Partner School Representatives**: Representatives from partner educational institutions

### 2. Role Separation
- **Citizen Records**: Completely separated from other user types for data privacy and security
- **Staff Management**: Integrated with the Staff service for role assignment (interviewer, reviewer, administrator, coordinator)
- **Role-Based Filtering**: View users by specific role to maintain clear organizational structure

### 3. User Management Capabilities

#### View Users
- Display all users with comprehensive information
- Filter by role (all, citizens, staff, admins, ps_reps)
- Search by name, email, or citizen ID
- View user status (active/inactive)

#### Create Users
- Add new users to the system
- Assign appropriate roles
- For staff users, assign system roles (interviewer, reviewer, administrator, coordinator)
- Set department and position for staff members

#### Edit Users
- Update user information
- Change user roles
- Modify staff-specific details (system role, department, position)
- Update contact information

#### Deactivate Users
- Soft delete by deactivating users
- Maintains data integrity
- Users can be reactivated if needed

### 4. Statistics Dashboard
- Total users count
- Active vs inactive users
- User distribution by role
- Real-time updates

## Architecture

### Backend Components

#### 1. UserManagementController (Scholarship Service)
Location: `microservices/scholarship_service/app/Http/Controllers/Api/UserManagementController.php`

**Endpoints:**
- `GET /api/users` - Get all users with role separation
- `GET /api/users/role/{role}` - Get users by specific role
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Deactivate user

**Key Features:**
- Communicates with Auth Service for user data
- Manages Staff records for staff users
- Categorizes users by role for proper separation
- Caching integration for performance

#### 2. UserController (Auth Service)
Location: `microservices/auth_service/app/Http/Controllers/UserController.php`

**Endpoints:**
- `GET /api/users` - Get all users with optional filtering
- `GET /api/users/role/{role}` - Get users by role
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `GET /api/users/email/{email}` - Get user by email
- `POST /api/users/batch` - Get multiple users by IDs
- `GET /api/users/staff` - Get all staff users

### Frontend Components

#### UserManagement Component
Location: `GSM/src/admin/components/modules/UserManagement/UserManagement.jsx`

**Features:**
- React-based interface
- Real-time search and filtering
- Modal-based create/edit forms
- Statistics cards
- Role-based badges
- Responsive design with dark mode support

## Data Flow

1. **User Creation:**
   - Frontend → Scholarship Service → Auth Service
   - If staff role: Auto-create Staff record in Scholarship Service
   - Return created user data

2. **User Updates:**
   - Frontend → Scholarship Service → Auth Service
   - If staff details updated: Update Staff record
   - Clear user cache
   - Return updated data

3. **User Retrieval:**
   - Frontend → Scholarship Service → Auth Service
   - Check cache first
   - Categorize by role
   - Add staff details if applicable
   - Return categorized data

## Security Considerations

1. **Role Separation:**
   - Citizen data is kept separate from administrative users
   - Role-based access control
   - Clear organizational boundaries

2. **Data Privacy:**
   - Passwords are hashed (bcrypt)
   - Sensitive data excluded from API responses
   - Audit trail through timestamps

3. **Soft Deletes:**
   - Users are deactivated, not deleted
   - Maintains referential integrity
   - Data recovery possible

## Usage

### Accessing User Management
1. Log in to the admin panel
2. Navigate to "User Management" in the sidebar
3. View all users or filter by role

### Creating a User
1. Click "Add New User" button
2. Fill in required fields:
   - Citizen ID
   - Email
   - Password
   - First Name, Last Name
   - Role
3. For staff users, additionally provide:
   - System Role
   - Department (optional)
   - Position (optional)
4. Click "Create User"

### Editing a User
1. Find the user in the list
2. Click the edit icon
3. Modify desired fields
4. Click "Update User"

### Deactivating a User
1. Find the user in the list
2. Click the delete/deactivate icon
3. Confirm the action
4. User status changes to inactive

## Role-Specific Features

### Staff Users
When a user has the "staff" role:
- Automatically creates a record in the Staff table
- Requires system_role selection (interviewer, reviewer, administrator, coordinator)
- Can include department and position
- Linked to interview scheduling and application review workflows

### Citizen Users
- Default role for regular users
- Separated from administrative users
- Can apply for scholarships and benefits
- Limited to citizen-specific features

### Administrator Users
- Full system access
- Can manage all aspects of the system
- Separated from regular staff

### Partner School Representatives
- Represents educational institutions
- Can verify student enrollment
- Access to partner school features

## API Examples

### Get All Users (Categorized)
```javascript
GET /api/users
Response:
{
  "success": true,
  "data": {
    "citizens": [...],
    "staff": [...],
    "admins": [...],
    "ps_reps": [...]
  }
}
```

### Create Staff User
```javascript
POST /api/users
Body:
{
  "citizen_id": "12345678901",
  "email": "staff@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "staff",
  "system_role": "interviewer",
  "department": "Scholarship Department",
  "position": "Senior Interviewer"
}
```

### Filter Users by Role
```javascript
GET /api/users/role/citizen
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "citizen_id": "12345678901",
      "email": "citizen@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "citizen",
      "is_active": true
    }
  ]
}
```

## Future Enhancements

1. **Bulk Operations:**
   - Import users from CSV
   - Bulk role assignment
   - Bulk status updates

2. **Advanced Filtering:**
   - Date range filters
   - Advanced search
   - Saved filters

3. **Audit Logs:**
   - Track all user modifications
   - User activity logs
   - Change history

4. **Permissions Management:**
   - Granular permissions
   - Custom roles
   - Permission inheritance

## Support

For issues or questions regarding the User Management system:
1. Check this documentation
2. Review the API documentation
3. Contact the development team

