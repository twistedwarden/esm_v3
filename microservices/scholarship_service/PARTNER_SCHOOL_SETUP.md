# Partner School Representative System

## Overview

This system allows partner school representatives to log in and view only the scholarship applications from students who selected their specific school.

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Partner School Rep logs in via External Auth Service        │
│     (In dev: auth_service)                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Auth Service returns user data with:                        │
│     - citizen_id: "PSREP-001"                                   │
│     - role: "ps_rep"                                            │
│     - first_name, last_name, email, etc.                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Scholarship Service receives request to /applications       │
│     - Extracts citizen_id from auth data                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Looks up in partner_school_representatives table:           │
│     SELECT school_id FROM partner_school_representatives        │
│     WHERE citizen_id = "PSREP-001" AND is_active = true         │
│                                                                  │
│     Result: school_id = 1 (Caloocan City Science High School)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Filters applications:                                        │
│     SELECT * FROM scholarship_applications                       │
│     WHERE school_id = 1                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Returns only applications from their school                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### partner_school_representatives Table

```sql
CREATE TABLE partner_school_representatives (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  citizen_id VARCHAR(255) UNIQUE NOT NULL,  -- Links to auth service user
  school_id BIGINT NOT NULL,                -- Which school they represent
  is_active BOOLEAN DEFAULT TRUE,           -- Enable/disable access
  assigned_at TIMESTAMP,                    -- When they were assigned
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);
```

### Why This Design?

1. **Separation of Concerns**: Auth service handles authentication, scholarship service handles authorization
2. **No Data Duplication**: User details (name, email) stay in auth service
3. **Flexible**: Can easily assign/unassign reps without touching auth service
4. **Auditable**: Track when assignments were made
5. **Production Ready**: Works with external auth systems

## Setup Instructions

### 1. Run Migrations

```bash
cd microservices/scholarship_service
php artisan migrate
```

This creates the `partner_school_representatives` table.

### 2. Seed Schools First

```bash
php artisan db:seed --class=SchoolSeeder
```

Make sure your schools are created before assigning representatives.

### 3. Seed Partner School Representatives

```bash
php artisan db:seed --class=PartnerSchoolRepresentativeSeeder
```

This assigns citizen IDs to schools.

### 4. Create Partner School Users in Auth Service (Dev Only)

```bash
cd microservices/auth_service
php artisan db:seed --class=PartnerSchoolSeeder
```

This creates the actual user accounts with role `ps_rep`.

## Managing Partner School Representatives

### Assign a New Representative

```php
use App\Models\PartnerSchoolRepresentative;

PartnerSchoolRepresentative::create([
    'citizen_id' => 'PSREP-004',
    'school_id' => 1,  // School ID from schools table
    'is_active' => true,
    'assigned_at' => now(),
]);
```

### Disable a Representative (Without Deleting)

```php
$rep = PartnerSchoolRepresentative::where('citizen_id', 'PSREP-001')->first();
$rep->update(['is_active' => false]);
```

### Change a Representative's School

```php
$rep = PartnerSchoolRepresentative::where('citizen_id', 'PSREP-001')->first();
$rep->update([
    'school_id' => 2,  // New school ID
    'assigned_at' => now(),
]);
```

### List All Representatives

```php
$reps = PartnerSchoolRepresentative::with('school')
    ->active()
    ->get();

foreach ($reps as $rep) {
    echo "{$rep->citizen_id} -> {$rep->school->name}\n";
}
```

## Testing

### 1. Login as Partner School Rep

```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "PSREP-001",
  "password": "psrep123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "citizen_id": "PSREP-001",
      "first_name": "Maria",
      "last_name": "Santos",
      "role": "ps_rep",
      ...
    },
    "token": "1|xxxxx..."
  }
}
```

### 2. Get Applications (Filtered by School)

```bash
GET http://localhost:8001/api/applications
Authorization: Bearer 1|xxxxx...
```

This will automatically return only applications where `school_id` matches the representative's assigned school.

### 3. Verify Filtering is Working

Check the logs:

```bash
cd microservices/scholarship_service
tail -f storage/logs/laravel.log
```

You should see:

```
Partner school rep filtering applications
citizen_id: PSREP-001
school_id: 1
school_name: Caloocan City Science High School
```

## Default Test Accounts

| Citizen ID | Email                | Password | School                            | School ID |
| ---------- | -------------------- | -------- | --------------------------------- | --------- |
| PSREP-001  | psrep@ccshs.edu.ph   | psrep123 | Caloocan City Science High School | 1         |
| PSREP-002  | psrep@uc.edu.ph      | psrep123 | University of Caloocan            | 2         |
| PSREP-003  | psrep@stmarys.edu.ph | psrep123 | St. Mary's Academy                | 3         |

## Production Deployment

### What Changes for Production?

1. **Auth Service**: Replace `auth_service` with actual external government auth system
2. **Token Validation**: Update middleware to validate tokens from production auth system
3. **User Data**: External system provides citizen_id and role
4. **Everything Else**: Works the same! The filtering logic remains unchanged

### Production Checklist

-   [ ] External auth system provides `citizen_id` in user data
-   [ ] External auth system provides `role` field with value `ps_rep`
-   [ ] Middleware extracts and passes auth_user data to controllers
-   [ ] Partner school representatives are added to `partner_school_representatives` table
-   [ ] Test that filtering works correctly

## Troubleshooting

### Rep Can't See Any Applications

**Check:**

1. Is their `citizen_id` in the `partner_school_representatives` table?
    ```sql
    SELECT * FROM partner_school_representatives WHERE citizen_id = 'PSREP-001';
    ```
2. Is `is_active = true`?
3. Are there any applications with their `school_id`?
    ```sql
    SELECT * FROM scholarship_applications WHERE school_id = 1;
    ```

### Rep Sees All Applications (Not Filtered)

**Check:**

1. Is the middleware passing `auth_user` data correctly?
2. Is `citizen_id` included in the auth_user data?
3. Check logs for "Partner school rep filtering applications" message

### Representative Assignment Not Working

**Check:**

1. Does the school exist in the `schools` table?
2. Run the seeder with verbose output:
    ```bash
    php artisan db:seed --class=PartnerSchoolRepresentativeSeeder -v
    ```

## API Reference

### Get Applications (Partner School Rep)

When a user with role `ps_rep` calls this endpoint, results are automatically filtered.

**Endpoint:** `GET /api/applications`

**Headers:**

```
Authorization: Bearer {token}
```

**Automatic Filtering:**

-   Extracts `citizen_id` from authenticated user
-   Looks up school assignment
-   Filters to only show applications from their school

**Additional Query Parameters:**

-   `status`: Filter by application status (pending, approved, rejected, etc.)
-   `type`: Filter by type (new, renewal)
-   `search`: Search student names or IDs
-   `per_page`: Results per page (default: 15)

## Model Methods

### PartnerSchoolRepresentative Model

```php
// Find active representative by citizen ID
$rep = PartnerSchoolRepresentative::findByCitizenId('PSREP-001');

// Get only active representatives
$active = PartnerSchoolRepresentative::active()->get();

// Get representative's school
$school = $rep->school;
```

## Security Notes

1. **citizen_id is the key**: This links the external auth system to your internal authorization
2. **No password stored**: Authentication handled by external system
3. **is_active flag**: Can quickly disable access without deleting records
4. **Logging**: All filtering actions are logged for audit purposes
5. **Empty results**: If rep not found or not active, returns empty result set (not an error)

## Future Enhancements

-   [ ] Allow multiple representatives per school
-   [ ] Add representative roles (viewer, editor, admin)
-   [ ] Email notifications when assigned to a school
-   [ ] Activity logs for representative actions
-   [ ] Bulk assignment/unassignment tools
-   [ ] Representative dashboard with school statistics
