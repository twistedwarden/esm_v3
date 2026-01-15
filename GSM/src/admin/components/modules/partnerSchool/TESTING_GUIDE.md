# Partner School Application - Testing Guide

## 🧪 Complete Testing Workflow

This guide will help you test the entire Partner School Application process from start to finish.

---

## 📋 Prerequisites

1. **Ensure services are running:**
   - Auth Service: `http://localhost:8000`
   - Scholarship Service: `http://localhost:8001`
   - Frontend: `http://localhost:5173`

2. **Ensure you're logged in as Admin** in the frontend

3. **Database migrations are run:**
   ```bash
   cd microservices/scholarship_service
   php artisan migrate
   ```

---

## 🚀 Testing Method 1: Using the UI (Recommended)

### Test Scenario 1: Direct Application Creation

#### Step 1: Create a New Application
1. Navigate to: **Sidebar → Partner School Database → Applications**
2. Click on **"Applications"** tab (first tab)
3. Click **"+ New Application"** button (top right)
4. Fill in the form:
   - **School Name**: "Test High School"
   - **Sender Email**: "test@school.edu"
   - **Sender Name**: "John Doe"
   - **Email Content**: "We would like to become a partner school"
   - **Admin Notes**: "Test application"
5. Click **"Create Application"**

**✅ Expected Result:**
- Application appears in the list with status **"Draft"**
- You can see the application card

#### Step 2: Submit Application
1. Click **👁️ Eye icon** on the application you just created
2. In the modal, click **"Submit for Review"**
3. Confirm the action

**✅ Expected Result:**
- Status changes to **"Submitted"**
- Modal shows updated status

#### Step 3: Create School Account
1. In the Application Details modal, click **"Create Account"** button
2. Enter:
   - **Email**: "contact@testschool.edu"
   - **First Name**: "Jane"
   - **Last Name**: "Smith"
   - **Contact Number**: "09123456789" (optional)
3. Confirm

**✅ Expected Result:**
- Account is created
- Success message appears
- Email is sent (check logs if email service is configured)

#### Step 4: Upload Documents (Simulate)
Since document upload is done by the school representative, you can:
- Check the **Document Review** modal (click 📄 File icon)
- It should show empty or pending documents

#### Step 5: Review and Approve
1. Change application status to "Under Review" (you may need to do this via database or API)
2. Click **📄 File icon** to review documents
3. Click **👁️ Eye icon** to view application details
4. Click **"Approve"** or **"Reject"**

**✅ Expected Result:**
- Status changes to "Approved" or "Rejected"
- Application is finalized

---

### Test Scenario 2: Email Application Workflow

#### Step 1: Create Test Email Application (via API or Database)

**Option A: Using API (if endpoint exists)**
```bash
curl -X POST http://localhost:8001/api/partner-school/email-applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sender_email": "school@example.com",
    "sender_name": "Principal Smith",
    "school_name": "Example High School",
    "email_content": "We are interested in becoming a partner school."
  }'
```

**Option B: Direct Database Insert**
```sql
INSERT INTO partner_school_application_emails 
(sender_email, sender_name, school_name, email_content, status, created_at, updated_at)
VALUES 
('school@example.com', 'Principal Smith', 'Example High School', 
 'We are interested in becoming a partner school.', 'received', NOW(), NOW());
```

#### Step 2: View Email Application
1. Navigate to: **Applications → Email Applications** tab
2. You should see the email you just created
3. Status should be **"Received"** (blue badge)

**✅ Expected Result:**
- Email appears in the list
- Shows sender name, school name, and received date

#### Step 3: Create Application from Email
1. Click **"Create Application"** button on the email card
2. Confirm the action

**✅ Expected Result:**
- Status changes to **"Processed"** (yellow badge)
- Application is created (check Applications tab)

#### Step 4: Create Account from Email
1. Click **"Create Account"** button (with user icon)
2. Enter account details:
   - Email: "contact@example.edu"
   - First Name: "John"
   - Last Name: "Doe"
   - Contact Number: "09123456789"
3. Confirm

**✅ Expected Result:**
- Status changes to **"Account Created"** (green badge)
- Account credentials sent via email

---

## 🔧 Testing Method 2: Using Database Seeders

### Create a Test Seeder

Create a file: `microservices/scholarship_service/database/seeders/PartnerSchoolApplicationTestSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerSchoolApplication;
use App\Models\PartnerSchoolApplicationEmail;
use App\Models\School;

class PartnerSchoolApplicationTestSeeder extends Seeder
{
    public function run(): void
    {
        // Create test email applications
        PartnerSchoolApplicationEmail::create([
            'sender_email' => 'test1@school.edu',
            'sender_name' => 'Principal Test',
            'school_name' => 'Test High School 1',
            'email_content' => 'We would like to apply as a partner school.',
            'status' => 'received',
        ]);

        PartnerSchoolApplicationEmail::create([
            'sender_email' => 'test2@school.edu',
            'sender_name' => 'Director Test',
            'school_name' => 'Test High School 2',
            'email_content' => 'Interested in partnership.',
            'status' => 'processed',
        ]);

        // Create test applications
        $school = School::first();
        
        PartnerSchoolApplication::create([
            'school_id' => $school?->id,
            'status' => 'draft',
            'admin_notes' => 'Test draft application',
        ]);

        PartnerSchoolApplication::create([
            'school_id' => $school?->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'admin_notes' => 'Test submitted application',
        ]);

        PartnerSchoolApplication::create([
            'school_id' => $school?->id,
            'status' => 'under_review',
            'submitted_at' => now()->subDays(2),
            'admin_notes' => 'Test application under review',
        ]);

        $this->command->info('Test data created successfully!');
    }
}
```

### Run the Seeder

```bash
cd microservices/scholarship_service
php artisan db:seed --class=PartnerSchoolApplicationTestSeeder
```

---

## 🧪 Testing Method 3: Using API Directly

### Test Email Applications Endpoint

```bash
# Get all email applications
curl http://localhost:8001/api/partner-school/email-applications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create email application
curl -X POST http://localhost:8001/api/partner-school/email-applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sender_email": "test@school.edu",
    "sender_name": "Test Principal",
    "school_name": "Test School",
    "email_content": "Test email content"
  }'
```

### Test Applications Endpoint

```bash
# Get all applications
curl http://localhost:8001/api/partner-school/applications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create application
curl -X POST http://localhost:8001/api/partner-school/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "school_name": "Test School",
    "sender_email": "test@school.edu",
    "sender_name": "Test Name",
    "email_content": "Test content",
    "admin_notes": "Test notes"
  }'

# Get specific application
curl http://localhost:8001/api/partner-school/applications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit application
curl -X POST http://localhost:8001/api/partner-school/applications/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN"

# Approve application
curl -X POST http://localhost:8001/api/partner-school/applications/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"notes": "Approved for testing"}'
```

---

## ✅ Checklist: What to Test

### Email Applications Tab
- [ ] View email applications list
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] View email details (Eye icon)
- [ ] Create application from email
- [ ] Create account from processed email
- [ ] Status badges display correctly

### Applications Tab
- [ ] View applications list
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Create new application (+ button)
- [ ] View application details (Eye icon)
- [ ] View documents (File icon)
- [ ] Submit application (from Draft)
- [ ] Create account (from Submitted)
- [ ] Approve application
- [ ] Reject application
- [ ] Pagination works (if >15 applications)

### Document Review
- [ ] View documents list
- [ ] View document (Eye icon)
- [ ] Download document
- [ ] Verify document
- [ ] Reject document with notes

### Status Transitions
- [ ] Draft → Submitted
- [ ] Submitted → Under Review
- [ ] Under Review → Document Review
- [ ] Document Review → Approved
- [ ] Any status → Rejected

### Account Creation
- [ ] Account created successfully
- [ ] Email sent (check logs)
- [ ] User can log in with credentials
- [ ] Password reset required on first login

---

## 🐛 Troubleshooting

### No Email Applications Showing
- Check database: `SELECT * FROM partner_school_application_emails;`
- Verify API endpoint is working
- Check browser console for errors

### Applications Not Loading
- Check authentication token is valid
- Verify API is accessible: `http://localhost:8001/api/partner-school/applications`
- Check browser network tab for API errors

### Account Creation Fails
- Verify auth service is running
- Check email service configuration
- Review server logs for errors

### Documents Not Uploading
- Check file upload permissions
- Verify storage directory exists
- Check file size limits

---

## 📊 Expected Database State

After testing, you should have:

**partner_school_application_emails:**
- At least 1 record with status 'received'
- At least 1 record with status 'processed'
- At least 1 record with status 'account_created'

**partner_school_applications:**
- At least 1 record with status 'draft'
- At least 1 record with status 'submitted'
- At least 1 record with status 'under_review'
- At least 1 record with status 'approved'

**users (in auth_service):**
- At least 1 user with role 'ps_rep' created from account creation

---

## 🎯 Quick Test Script

Run this in your browser console while on the Applications page:

```javascript
// Test creating an application via API
fetch('http://localhost:8001/api/partner-school/applications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    school_name: 'Console Test School',
    sender_email: 'test@console.edu',
    sender_name: 'Console Test',
    email_content: 'Test from browser console',
    admin_notes: 'Console test'
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 📝 Notes

- All test data can be cleaned up by truncating tables
- Email sending requires proper SMTP configuration
- Some features require specific status transitions
- Check server logs for detailed error messages
