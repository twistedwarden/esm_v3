# Partner School Representative Implementation Summary

## ✅ Implementation Complete

The system now supports partner school representatives who can log in and view **only the scholarship applications from students enrolled at their assigned school**.

---

## 🎯 What Was Implemented

### 1. **New Database Table**

`partner_school_representatives` - Links citizen IDs (from auth service) to schools

**Structure:**

- `citizen_id` → Links to user in auth service
- `school_id` → Which school they represent
- `is_active` → Enable/disable access
- `assigned_at` → Audit trail

### 2. **Laravel Model**

`app/Models/PartnerSchoolRepresentative.php`

- Eloquent model with relationships
- Helper methods like `findByCitizenId()`
- Active scope for filtering

### 3. **Seeder**

`database/seeders/PartnerSchoolRepresentativeSeeder.php`

- Seeds test data linking citizen IDs to schools
- Matches the partner school users in auth_service

### 4. **Controller Update**

`app/Http/Controllers/ScholarshipApplicationController.php`

- Added automatic filtering for `ps_rep` role
- Looks up school assignment by citizen_id
- Returns only applications from their school
- Includes logging for debugging

### 5. **Documentation**

- `PARTNER_SCHOOL_SETUP.md` - Detailed documentation
- `QUICK_START_PARTNER_SCHOOLS.md` - Quick setup guide

---

## 🔄 How The System Works

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Partner School Rep Logs In                               │
│    → Auth Service (external system in production)           │
│    → Returns: citizen_id, role=ps_rep                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Requests Scholarship Applications                         │
│    → GET /api/applications                                   │
│    → Authorization: Bearer {token}                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. ScholarshipApplicationController                          │
│    → Detects role = ps_rep                                   │
│    → Extracts citizen_id from auth data                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Looks Up School Assignment                                │
│    → SELECT school_id FROM partner_school_representatives    │
│      WHERE citizen_id = ? AND is_active = true               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Filters Applications                                      │
│    → WHERE school_id = {rep's school}                        │
│    → Returns only applications from their school             │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Setup Instructions

### Quick Setup (5 minutes)

```bash
# 1. Navigate to scholarship service
cd microservices/scholarship_service

# 2. Run migration to create the table
php artisan migrate

# 3. Seed schools (if not already done)
php artisan db:seed --class=SchoolSeeder

# 4. Assign partner reps to schools
php artisan db:seed --class=PartnerSchoolRepresentativeSeeder

# 5. (Dev only) Create test users in auth service
cd ../auth_service
php artisan db:seed --class=PartnerSchoolSeeder
```

---

## 🧪 Testing

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "PSREP-001",
    "password": "psrep123"
  }'
```

### Test Filtered Applications

```bash
curl http://localhost:8001/api/applications \
  -H "Authorization: Bearer {token_from_login}"
```

**Expected Result:** Only applications where students selected "Caloocan City Science High School"

---

## 🔐 Test Accounts

| Citizen ID | Email                | Password | Assigned School                   |
| ---------- | -------------------- | -------- | --------------------------------- |
| PSREP-001  | psrep@ccshs.edu.ph   | psrep123 | Caloocan City Science High School |
| PSREP-002  | psrep@uc.edu.ph      | psrep123 | University of Caloocan            |
| PSREP-003  | psrep@stmarys.edu.ph | psrep123 | St. Mary's Academy                |

---

## 🏗️ Architecture Benefits

### ✅ Clean Separation

- **Auth Service** → Only handles authentication (who you are)
- **Scholarship Service** → Handles authorization (what you can access)

### ✅ No Data Duplication

- User details (name, email) stay in auth service
- Only citizen_id is stored in scholarship service

### ✅ Production Ready

- Works with external government auth systems
- Just needs citizen_id and role from auth
- Easy to add/remove representatives

### ✅ Flexible Management

- Enable/disable access without deleting records
- Reassign representatives to different schools
- Track assignment history with `assigned_at`

---

## 📝 Managing Representatives

### Add New Representative

```php
use App\Models\PartnerSchoolRepresentative;

PartnerSchoolRepresentative::create([
    'citizen_id' => 'PSREP-004',
    'school_id' => 1,
    'is_active' => true,
    'assigned_at' => now(),
]);
```

### Disable Representative

```php
$rep = PartnerSchoolRepresentative::where('citizen_id', 'PSREP-001')->first();
$rep->update(['is_active' => false]);
```

### Change School Assignment

```php
$rep = PartnerSchoolRepresentative::where('citizen_id', 'PSREP-001')->first();
$rep->update([
    'school_id' => 2,
    'assigned_at' => now(),
]);
```

---

## 🚀 Production Deployment

### What Changes?

1. Replace `auth_service` with actual external government auth system
2. Ensure external system provides:
   - `citizen_id` in user data
   - `role` field with value `ps_rep`
3. Add actual representatives to `partner_school_representatives` table

### What Stays The Same?

- Filtering logic (automatic)
- Database structure
- API endpoints
- Everything else!

---

## 📂 Files Modified/Created

### New Files

- ✅ `microservices/scholarship_service/database/migrations/2025_01_16_000001_create_partner_school_representatives_table.php`
- ✅ `microservices/scholarship_service/app/Models/PartnerSchoolRepresentative.php`
- ✅ `microservices/scholarship_service/database/seeders/PartnerSchoolRepresentativeSeeder.php`
- ✅ `microservices/scholarship_service/PARTNER_SCHOOL_SETUP.md`
- ✅ `microservices/scholarship_service/QUICK_START_PARTNER_SCHOOLS.md`

### Modified Files

- ✅ `microservices/scholarship_service/app/Http/Controllers/ScholarshipApplicationController.php` - Added filtering logic
- ✅ `microservices/scholarship_service/database/seeders/DatabaseSeeder.php` - Added new seeder

### Existing Files (No Changes Needed)

- ✅ `microservices/auth_service/database/seeders/PartnerSchoolSeeder.php` - Already creates ps_rep users
- ✅ `microservices/auth_service/app/Http/Controllers/AuthController.php` - Already returns citizen_id

---

## 🐛 Debugging

### Check if Rep is Assigned

```sql
SELECT * FROM partner_school_representatives
WHERE citizen_id = 'PSREP-001';
```

### Check Applications for School

```sql
SELECT id, application_number, student_id, school_id
FROM scholarship_applications
WHERE school_id = 1;
```

### View Logs

```bash
tail -f microservices/scholarship_service/storage/logs/laravel.log
```

Look for: `Partner school rep filtering applications`

---

## ✨ Summary

**You asked:** "How does the system know what school partner school reps are from?"

**Answer:** By storing their `citizen_id` (from the external auth system) in a local `partner_school_representatives` table that links them to a specific school. When they request applications, the system:

1. Gets their `citizen_id` from the auth token
2. Looks up their assigned school
3. Filters applications to only show that school

This design keeps your auth service clean (it's just for authentication) while your scholarship service handles the authorization logic!

---

## 📚 Next Steps

1. **Run the migrations and seeders** (see Setup Instructions above)
2. **Test with the provided test accounts**
3. **Check the logs** to verify filtering is working
4. **Read `PARTNER_SCHOOL_SETUP.md`** for detailed documentation

Need help? Check the troubleshooting section in `PARTNER_SCHOOL_SETUP.md`!
