# Quick Start: Partner School Representatives

## What Was Implemented

Partner school representatives can now log in and see **only the scholarship applications from students enrolled at their school**.

## How It Works

1. **Auth Service** → User logs in, gets role `ps_rep` and `citizen_id`
2. **Scholarship Service** → Looks up `citizen_id` in `partner_school_representatives` table
3. **Filtering** → Only shows applications where `school_id` matches their assigned school

## Setup (5 minutes)

### Step 1: Run Migration

```bash
cd microservices/scholarship_service
php artisan migrate
```

### Step 2: Seed Data

```bash
# Make sure schools exist first
php artisan db:seed --class=SchoolSeeder

# Assign partner reps to schools
php artisan db:seed --class=PartnerSchoolRepresentativeSeeder

# Or run all seeders
php artisan db:seed
```

### Step 3: Create Test Users (Dev Only)

```bash
cd ../auth_service
php artisan db:seed --class=PartnerSchoolSeeder
```

## Test It

### 1. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "PSREP-001", "password": "psrep123"}'
```

### 2. Get Applications (Automatically Filtered!)

```bash
curl http://localhost:8001/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

You should only see applications from "Caloocan City Science High School" (school_id = 1).

## Test Accounts

| Login (username) | Password | School                            |
| ---------------- | -------- | --------------------------------- |
| PSREP-001        | psrep123 | Caloocan City Science High School |
| PSREP-002        | psrep123 | University of Caloocan            |
| PSREP-003        | psrep123 | St. Mary's Academy                |

## Files Created

✅ `database/migrations/2025_01_16_000001_create_partner_school_representatives_table.php`  
✅ `app/Models/PartnerSchoolRepresentative.php`  
✅ `database/seeders/PartnerSchoolRepresentativeSeeder.php`  
✅ `app/Http/Controllers/ScholarshipApplicationController.php` (updated)  
✅ `database/seeders/DatabaseSeeder.php` (updated)

## Need to Add a New Representative?

### Option 1: Via Seeder (Recommended for bulk)

Edit `database/seeders/PartnerSchoolRepresentativeSeeder.php` and add to the array:

```php
[
    'citizen_id' => 'PSREP-004',
    'school_name' => 'New School Name',
],
```

Then run:

```bash
php artisan db:seed --class=PartnerSchoolRepresentativeSeeder
```

### Option 2: Via Database (Quick single entry)

```sql
INSERT INTO partner_school_representatives (citizen_id, school_id, is_active, assigned_at)
VALUES ('PSREP-004', 1, true, NOW());
```

### Option 3: Via Tinker (Interactive)

```bash
php artisan tinker
```

```php
App\Models\PartnerSchoolRepresentative::create([
    'citizen_id' => 'PSREP-004',
    'school_id' => 1,
    'is_active' => true,
    'assigned_at' => now(),
]);
```

## Production Notes

In production:

-   Your external auth system provides `citizen_id`
-   Just add citizen IDs to `partner_school_representatives` table
-   Everything else works automatically

See `PARTNER_SCHOOL_SETUP.md` for detailed documentation.
