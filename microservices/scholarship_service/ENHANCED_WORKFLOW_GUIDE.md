# Enhanced Scholarship Application Workflow Guide

## Overview

This document describes the enhanced scholarship application workflow that includes enrollment verification and interview scheduling features. The new workflow provides a more comprehensive and structured process for managing scholarship applications from submission to final approval.

## Workflow Overview

### Previous Workflow
```
DRAFT → SUBMITTED → DOCUMENTS_REVIEWED → INTERVIEW_SCHEDULED → ENDORSED_TO_SSC → APPROVED → GRANTS_PROCESSING → GRANTS_DISBURSED
```

### New Enhanced Workflow
```
DRAFT → SUBMITTED → DOCUMENTS_REVIEWED → 
APPROVED_PENDING_VERIFICATION → ENROLLMENT_VERIFIED → 
INTERVIEW_SCHEDULED (auto/manual) → INTERVIEW_COMPLETED → 
ENDORSED_TO_SSC → FINAL_APPROVED → GRANTS_PROCESSING → GRANTS_DISBURSED
```

## New Status Definitions

### 1. APPROVED_PENDING_VERIFICATION
- **Description**: Application has been approved for enrollment verification
- **Trigger**: Admin approves application after document review
- **Next Steps**: Student must submit enrollment proof documents
- **API Endpoint**: `POST /api/applications/{id}/approve-for-verification`

### 2. ENROLLMENT_VERIFIED
- **Description**: Student's enrollment status has been verified
- **Trigger**: Admin verifies enrollment documents
- **Next Steps**: Schedule interview (automatic or manual)
- **API Endpoint**: `POST /api/applications/{id}/verify-enrollment`

### 3. INTERVIEW_SCHEDULED
- **Description**: Interview has been scheduled for the student
- **Trigger**: Admin schedules interview or system auto-schedules
- **Next Steps**: Conduct interview and record results
- **API Endpoint**: `POST /api/applications/{id}/schedule-interview` or `POST /api/applications/{id}/schedule-interview-auto`

### 4. INTERVIEW_COMPLETED
- **Description**: Interview has been completed with results recorded
- **Trigger**: Admin marks interview as completed
- **Next Steps**: Endorse to SSC for final approval
- **API Endpoint**: `POST /api/applications/{id}/complete-interview`

## Database Schema

### New Tables

#### 1. enrollment_verifications
Stores enrollment verification records for each application.

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| application_id | bigint | Foreign key to scholarship_applications |
| student_id | bigint | Foreign key to students |
| school_id | bigint | Foreign key to schools |
| verification_status | enum | pending, verified, rejected, needs_review |
| enrollment_proof_document_id | bigint | Foreign key to documents |
| verified_by | bigint | User ID who verified |
| verified_at | timestamp | When verification was completed |
| verification_notes | text | Notes about verification |
| enrollment_year | varchar | Academic year (e.g., "2024-2025") |
| enrollment_term | varchar | Term (e.g., "1st Semester") |
| is_currently_enrolled | boolean | Current enrollment status |

#### 2. interview_schedules
Stores interview scheduling information.

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| application_id | bigint | Foreign key to scholarship_applications |
| student_id | bigint | Foreign key to students |
| interview_date | date | Date of interview |
| interview_time | time | Time of interview |
| interview_location | varchar | Location or "Online" |
| interview_type | enum | in_person, online, phone |
| meeting_link | varchar | For online interviews |
| interviewer_id | bigint | User ID of interviewer |
| interviewer_name | varchar | Name of interviewer |
| scheduling_type | enum | automatic, manual |
| status | enum | scheduled, rescheduled, completed, cancelled, no_show |
| interview_notes | text | Notes about interview |
| interview_result | enum | passed, failed, needs_followup |
| completed_at | timestamp | When interview was completed |
| scheduled_by | bigint | User ID who scheduled |

### Updated Tables

#### scholarship_applications
Added new columns:
- `enrollment_verification_id` - Foreign key to enrollment_verifications
- `interview_schedule_id` - Foreign key to interview_schedules
- `enrollment_verified_at` - Timestamp when enrollment was verified
- `interview_completed_at` - Timestamp when interview was completed

## API Endpoints

### Enrollment Verification Endpoints

#### GET /api/enrollment-verifications
List all enrollment verifications with filtering options.

**Query Parameters:**
- `status` - Filter by verification status
- `school_id` - Filter by school
- `search` - Search by student name or ID
- `per_page` - Number of results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "current_page": 1,
    "per_page": 15,
    "total": 100
  }
}
```

#### GET /api/enrollment-verifications/{id}
Get detailed information about a specific verification.

#### POST /api/enrollment-verifications/{id}/approve
Approve an enrollment verification.

**Request Body:**
```json
{
  "verification_notes": "Enrollment verified successfully"
}
```

#### POST /api/enrollment-verifications/{id}/reject
Reject an enrollment verification.

**Request Body:**
```json
{
  "verification_notes": "Enrollment certificate is invalid"
}
```

#### GET /api/enrollment-verifications/stats/overview
Get statistics about enrollment verifications.

### Interview Schedule Endpoints

#### GET /api/interview-schedules
List all interview schedules with filtering options.

**Query Parameters:**
- `status` - Filter by interview status
- `interviewer_id` - Filter by interviewer
- `date_from` - Filter by start date
- `date_to` - Filter by end date
- `search` - Search by student name or ID

#### POST /api/interview-schedules
Create a new interview schedule.

**Request Body:**
```json
{
  "application_id": 1,
  "interview_date": "2024-02-15",
  "interview_time": "10:00",
  "interview_location": "Main Office - Room 101",
  "interview_type": "in_person",
  "interviewer_id": 1,
  "interviewer_name": "Dr. Maria Santos",
  "scheduling_type": "manual"
}
```

#### PUT /api/interview-schedules/{id}/reschedule
Reschedule an existing interview.

**Request Body:**
```json
{
  "interview_date": "2024-02-16",
  "interview_time": "14:00",
  "reason": "Student requested reschedule"
}
```

#### POST /api/interview-schedules/{id}/complete
Mark an interview as completed.

**Request Body:**
```json
{
  "interview_result": "passed",
  "interview_notes": "Student performed excellently"
}
```

#### GET /api/interview-schedules/available-slots
Get available interview time slots.

**Query Parameters:**
- `date` - Date to check availability
- `interview_type` - Type of interview (in_person, online, phone)
- `interviewer_id` - Specific interviewer

#### GET /api/interview-schedules/calendar
Get calendar view of interviews for a specific month.

**Query Parameters:**
- `month` - Month in YYYY-MM format

### Application Workflow Endpoints

#### POST /api/applications/{id}/approve-for-verification
Approve application for enrollment verification.

**Request Body:**
```json
{
  "notes": "Documents reviewed and approved for verification"
}
```

#### POST /api/applications/{id}/verify-enrollment
Submit enrollment verification.

**Request Body:**
```json
{
  "enrollment_proof_document_id": 1,
  "enrollment_year": "2024-2025",
  "enrollment_term": "1st Semester",
  "is_currently_enrolled": true
}
```

#### POST /api/applications/{id}/schedule-interview
Schedule interview manually.

**Request Body:**
```json
{
  "interview_date": "2024-02-15",
  "interview_time": "10:00",
  "interview_location": "Main Office - Room 101",
  "interview_type": "in_person",
  "interviewer_id": 1,
  "interviewer_name": "Dr. Maria Santos",
  "notes": "Initial interview"
}
```

#### POST /api/applications/{id}/schedule-interview-auto
Schedule interview automatically using AI.

#### POST /api/applications/{id}/complete-interview
Complete interview and record results.

**Request Body:**
```json
{
  "interview_result": "passed",
  "interview_notes": "Student demonstrated strong academic potential"
}
```

## Services

### InterviewSlotService
Handles automatic interview scheduling logic.

**Key Methods:**
- `getAvailableSlots($date, $interviewType, $interviewerId)` - Get available time slots
- `assignSlotAutomatically($applicationId, $preferences)` - Auto-assign interview slot
- `checkConflicts($date, $time, $interviewerId)` - Check for scheduling conflicts
- `balanceInterviewerWorkload($date)` - Balance workload across interviewers

### NotificationService
Handles email and SMS notifications.

**Key Methods:**
- `sendInterviewScheduledNotification($schedule)` - Send interview confirmation
- `sendInterviewReminderNotification($schedule)` - Send interview reminder
- `sendEnrollmentVerificationNotification($verification)` - Send verification status
- `sendBulkInterviewReminders()` - Send bulk reminders

## User Roles and Permissions

### Admin/Staff
- Full access to all verification and scheduling features
- Can approve/reject enrollment verifications
- Can schedule, reschedule, and complete interviews
- Can view all statistics and reports

### SSC Members
- Can view and complete interviews
- Can reschedule interviews if needed
- Can view interview statistics

### Partner School Representatives
- Can verify enrollment for their assigned school only
- Can view applications from their school
- Limited access to interview scheduling

### Students
- Can upload enrollment proof documents
- Can view their interview schedule
- Can request reschedule (if allowed)
- Receive notifications about status changes

## Frontend Integration

### Admin Dashboard Components

#### Enrollment Verification Module
- **File**: `GSM/src/admin/components/modules/scholarship/verification/EnrollmentVerification.jsx`
- **Features**:
  - List of pending verifications
  - Document viewer for enrollment proof
  - Approve/Reject actions with notes
  - Filter by school, status, date
  - Bulk operations

#### Interview Scheduling Module
- **File**: `GSM/src/admin/components/modules/scholarship/interview/InterviewScheduling.jsx`
- **Features**:
  - Calendar view of interviews
  - List view with filters
  - Manual scheduling form
  - Auto-scheduling with AI suggestions
  - Reschedule/Cancel functionality
  - Interview completion form

### Student Portal Components

#### Enrollment Verification Upload
- **File**: `GSM/src/pages/scholarshipDashboard/EnrollmentVerificationUpload.tsx`
- **Features**:
  - Upload enrollment certificate
  - View verification status
  - Re-upload if rejected

#### Interview Schedule Viewer
- **File**: `GSM/src/pages/scholarshipDashboard/InterviewSchedule.tsx`
- **Features**:
  - View scheduled interview details
  - Add to calendar
  - Request reschedule
  - View meeting link (for online interviews)

## Testing

### Backend Testing
Run the following commands to test the new features:

```bash
# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed --class=EnrollmentVerificationSeeder
php artisan db:seed --class=InterviewScheduleSeeder

# Run tests
php artisan test
```

### API Testing
Use the following curl commands to test the API endpoints:

```bash
# Test enrollment verification approval
curl -X POST http://localhost:8001/api/enrollment-verifications/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verification_notes": "Enrollment verified successfully"}'

# Test interview scheduling
curl -X POST http://localhost:8001/api/interview-schedules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": 1,
    "interview_date": "2024-02-15",
    "interview_time": "10:00",
    "interview_location": "Main Office - Room 101",
    "interview_type": "in_person",
    "interviewer_name": "Dr. Maria Santos",
    "scheduling_type": "manual"
  }'
```

## Migration Guide

### From Old Workflow to New Workflow

1. **Run Database Migrations**
   ```bash
   php artisan migrate
   ```

2. **Update Application Statuses**
   - Applications in `documents_reviewed` status can be moved to `approved_pending_verification`
   - Applications in `interview_scheduled` status can be moved to `interview_completed`

3. **Update Frontend Components**
   - Add new action buttons for verification and scheduling
   - Update status displays to show new workflow states
   - Integrate new API endpoints

4. **Configure Notifications**
   - Set up email templates for new notification types
   - Configure SMS service if needed
   - Test notification delivery

## Troubleshooting

### Common Issues

1. **Migration Errors**
   - Ensure all previous migrations have been run
   - Check database permissions
   - Verify foreign key constraints

2. **API Errors**
   - Check authentication tokens
   - Verify request body format
   - Check application status before performing actions

3. **Scheduling Conflicts**
   - Use the conflict detection service
   - Check interviewer availability
   - Verify time slot availability

### Debug Commands

```bash
# Check application statuses
php artisan tinker
>>> App\Models\ScholarshipApplication::select('id', 'status')->get();

# Check enrollment verifications
>>> App\Models\EnrollmentVerification::with('student')->get();

# Check interview schedules
>>> App\Models\InterviewSchedule::with('student')->get();
```

## Support

For technical support or questions about the enhanced workflow:

1. Check the API documentation
2. Review the database schema
3. Test with the provided seeders
4. Contact the development team

## Changelog

### Version 2.0.0
- Added enrollment verification workflow
- Added interview scheduling system
- Added automatic scheduling with AI
- Added comprehensive notification system
- Added new database tables and relationships
- Added new API endpoints
- Updated application workflow statuses
- Added frontend components for admin and student portals
