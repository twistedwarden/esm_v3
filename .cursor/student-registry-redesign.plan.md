# Student Registry Module Redesign Plan

## Phase 1: Auto-Registration from SSC Approval

### 1.1 Create Student Auto-Registration Service
**File: `GSM/src/services/studentRegistrationService.js`**
- Function `autoRegisterFromSSCApproval(applicationData)` - automatically creates student record when SSC approves
- Extracts student data from scholarship application
- Creates comprehensive student profile with:
  - Basic info (name, student number, contact, email)
  - Academic records (enrollment date, year level, program, school)
  - Scholarship status (approved amount, award date, scholarship type)
  - Initial status set to 'active'
- Returns created student record

### 1.2 Hook Auto-Registration into SSC Final Approval
**File: `GSM/src/admin/components/modules/scholarship/ssc/FinalApprovalReview.jsx`**
- Line 75-80: After `scholarshipApiService.sscFinalApproval()` succeeds
- Add call to `studentRegistrationService.autoRegisterFromSSCApproval(selectedApplication)`
- Show success message: "Student registered in Student Registry"
- Handle errors gracefully (log but don't block approval)

### 1.3 Add Backend API Endpoint (Documentation)
**Create API documentation file: `docs/student-registry-api.md`**
- `POST /api/students/register-from-scholarship` - registers student from approved application
- Request body: application_id, student data, scholarship data
- Response: created student record with student_uuid

## Phase 2: Comprehensive Student Profile Structure

### 2.1 Update Student Data Model
**File: `GSM/src/types/studentRegistry.ts`** (new file)
```typescript
interface StudentProfile {
  // Basic Information
  student_uuid: string;
  student_number: string;
  citizen_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  
  // Academic Records
  current_school_id: number;
  year_level: string;
  program: string;
  enrollment_date: string;
  academic_status: 'enrolled' | 'graduated' | 'dropped' | 'transferred';
  gpa: number;
  
  // Scholarship Information
  scholarship_status: 'none' | 'applicant' | 'scholar' | 'alumni';
  current_scholarship_id: number;
  approved_amount: number;
  scholarship_start_date: string;
  total_scholarships_received: number;
  
  // Financial Aid History
  financial_aid_records: Array<{
    type: 'scholarship' | 'grant' | 'loan';
    amount: number;
    date: string;
    status: string;
  }>;
  
  // Documents
  documents: Array<{
    id: number;
    type: string;
    filename: string;
    uploaded_at: string;
  }>;
  
  // Notes & Tracking
  notes: Array<{
    id: number;
    note: string;
    created_by: string;
    created_at: string;
  }>;
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}
```

## Phase 3: Redesign Student Registry Module

### 3.1 New Main Overview Component
**File: `GSM/src/admin/components/modules/studentRegistry/StudentRegistryOverview.jsx`**
Replace entirely with new structure:
- Dashboard showing key metrics:
  - Total registered students
  - Active scholars count
  - Students by scholarship status (pie chart)
  - Recent registrations (last 30 days)
- Quick filters: All Students, Active Scholars, Applicants, Alumni
- Search bar with advanced filters
- Action buttons: Manual Add Student, Import, Export

### 3.2 Redesign Active Students View
**File: `GSM/src/admin/components/modules/studentRegistry/ActiveStudents.jsx`**
Update to show:
- Comprehensive student table with columns:
  - Student Number, Name, Email, Program, Year Level
  - School, Scholarship Status, GPA, Status
  - Actions: View Profile, Edit, Add Note, Archive
- Inline filters for school, program, year level, scholarship status
- Bulk actions: Update status, Export selected, Send notification
- Click row to open detailed student profile modal

### 3.3 Create New Student Profile Modal
**File: `GSM/src/admin/components/modules/studentRegistry/StudentProfileModal.jsx`** (new)
Comprehensive view with tabs:
- **Overview Tab**: Basic info, photo, contact details, current status
- **Academic Tab**: 
  - Enrollment history
  - Current program & year level
  - GPA tracking over time (line chart)
  - Academic performance notes
- **Scholarship Tab**:
  - Current scholarship details (amount, type, start date)
  - Complete scholarship history
  - Application timeline
  - Award letters & documents
- **Financial Aid Tab**:
  - All financial aid received (scholarships, grants, loans)
  - Total amount received
  - Payment history
  - Outstanding balances
- **Documents Tab**:
  - Categorized documents (academic, financial, personal)
  - Upload new documents
  - Download/view existing
  - Document verification status
- **Activity Log Tab**:
  - All system actions related to this student
  - Notes added by admins
  - Status changes
  - Add new note functionality

### 3.4 Enhanced Edit Student Modal
**File: `GSM/src/admin/components/modules/studentRegistry/EditStudentModal.jsx`**
Update to include all fields from comprehensive profile:
- Multi-step form: Basic Info → Academic Info → Contact Info
- Real-time validation
- Save draft functionality
- Audit trail of changes

### 3.5 Scholars Management View
**File: `GSM/src/admin/components/modules/studentRegistry/Scholars.jsx`**
Redesign to focus on active scholars:
- Filter by scholarship type/category
- Show scholarship-specific data: award amount, start date, end date
- Track scholarship compliance: grades, attendance
- Alert system for at-risk scholars (low GPA, missed requirements)
- Generate scholarship reports

### 3.6 Keep & Enhance Bulk Operations
**File: `GSM/src/admin/components/modules/studentRegistry/BulkOperations.jsx`**
Keep existing functionality, add new operations:
- Bulk update academic status
- Bulk add notes/tags
- Bulk document request
- Bulk notification sending

### 3.7 Keep & Enhance Import/Export
**File: `GSM/src/admin/components/modules/studentRegistry/ImportExport.jsx`**
Keep existing, enhance with:
- Export with comprehensive data (academic, financial, documents metadata)
- Import validation for new fields
- Template generator for comprehensive import

### 3.8 Archived Students View
**File: `GSM/src/admin/components/modules/studentRegistry/ArchivedStudents.jsx`**
Keep existing structure, add:
- Archive reason tracking
- Restore with notes
- Permanent delete after retention period

### 3.9 New Reports & Analytics
**File: `GSM/src/admin/components/modules/studentRegistry/ReportsAnalytics.jsx`**
Complete redesign with:
- **Student Demographics Report**: By school, program, year level
- **Scholarship Impact Report**: Scholars vs non-scholars, retention rates
- **Academic Performance Report**: GPA trends, graduation rates
- **Financial Aid Report**: Total aid distributed, average per student
- **Enrollment Trends**: Historical data, projections
- Export reports as PDF/Excel
- Visual charts using Chart.js or Recharts

## Phase 4: API Integration & Services

### 4.1 Update Student API Service
**File: `GSM/src/services/studentApiService.js`** (new)
Create comprehensive CRUD service:
- `getStudents(filters)` - with pagination, search, filters
- `getStudentByUUID(uuid)` - full profile
- `createStudent(data)` - manual registration
- `updateStudent(uuid, data)` - edit profile
- `deleteStudent(uuid)` - soft delete
- `archiveStudent(uuid, reason)` - move to archive
- `restoreStudent(uuid)` - restore from archive
- `addStudentNote(uuid, note)` - add admin note
- `uploadStudentDocument(uuid, file)` - upload document
- `getStudentFinancialHistory(uuid)` - get financial aid records
- `getStudentAcademicHistory(uuid)` - get academic records
- `updateAcademicStatus(uuid, status)` - update enrollment status
- `getStudentStatistics()` - for dashboard

### 4.2 Integration Points
- Link to scholarship applications: `/api/students/{uuid}/scholarships`
- Link to financial aid: `/api/students/{uuid}/financial-aid`
- Link to documents: `/api/students/{uuid}/documents`
- Link to schools: `/api/students/{uuid}/school-history`

## Phase 5: New Features & Enhancements

### 5.1 Student Notification System
**File: `GSM/src/admin/components/modules/studentRegistry/StudentNotifications.jsx`** (new)
- Send email/SMS to individual students
- Bulk notifications to filtered groups
- Templates: Welcome message, scholarship award, document request, status update
- Track notification history

### 5.2 Document Management System
**File: `GSM/src/admin/components/modules/studentRegistry/DocumentManager.jsx`** (new)
- Upload/download documents per student
- Document categories: Academic, Financial, Personal, Scholarship
- Verification status tracking
- Expiration date tracking (e.g., certificates)
- Bulk document requests

### 5.3 Academic Progress Tracking
**File: `GSM/src/admin/components/modules/studentRegistry/AcademicTracking.jsx`** (new)
- Record semester grades
- Track GPA over time
- Attendance monitoring
- Flag at-risk students
- Generate academic reports

### 5.4 Compliance Monitoring
**File: `GSM/src/admin/components/modules/studentRegistry/ComplianceMonitoring.jsx`** (new)
For scholarship recipients:
- Track grade requirements
- Monitor attendance
- Document submission deadlines
- Alerts for non-compliance
- Automatic status updates

## Phase 6: UI/UX Improvements

### 6.1 Consistent Design System
- Use existing admin color scheme (orange/blue/slate)
- Framer Motion animations for smooth transitions
- Loading states with custom spinners
- Toast notifications for all actions
- Confirmation modals for destructive actions

### 6.2 Responsive Design
- Mobile-friendly tables (card view on mobile)
- Collapsible filters on small screens
- Touch-friendly buttons and controls

### 6.3 Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Color contrast compliance

## Phase 7: Testing & Documentation

### 7.1 Component Testing
- Test auto-registration flow
- Test CRUD operations
- Test filters and search
- Test bulk operations
- Test document upload/download

### 7.2 User Documentation
**File: `docs/student-registry-user-guide.md`**
- How to use each feature
- Screenshots and walkthrough
- Common workflows
- FAQ section

## Implementation Order

1. Create student registration service & types (Phase 2.1, 1.1)
2. Hook auto-registration into SSC approval (Phase 1.2)
3. Build comprehensive student profile modal (Phase 3.3)
4. Redesign main overview & active students (Phase 3.1, 3.2)
5. Update edit modal with comprehensive fields (Phase 3.4)
6. Redesign scholars management (Phase 3.5)
7. Enhance bulk operations & import/export (Phase 3.6, 3.7)
8. Build reports & analytics (Phase 3.9)
9. Add notification system (Phase 5.1)
10. Add document management (Phase 5.2)
11. Add academic tracking & compliance (Phase 5.3, 5.4)
12. Polish UI/UX (Phase 6)
13. Testing & documentation (Phase 7)

## Key Files to Replace/Modify

**Replace Completely:**
- `StudentRegistryOverview.jsx` - new dashboard design
- `ActiveStudents.jsx` - comprehensive student management
- `Scholars.jsx` - scholar-focused view
- `ReportsAnalytics.jsx` - new analytics

**Enhance/Modify:**
- `EditStudentModal.jsx` - add comprehensive fields
- `BulkOperations.jsx` - add new bulk actions
- `ImportExport.jsx` - support comprehensive data
- `ArchivedStudents.jsx` - add archive reasons

**Create New:**
- `StudentProfileModal.jsx` - main student detail view
- `StudentNotifications.jsx` - notification system
- `DocumentManager.jsx` - document management
- `AcademicTracking.jsx` - academic progress
- `ComplianceMonitoring.jsx` - scholarship compliance
- `studentApiService.js` - API service
- `studentRegistrationService.js` - auto-registration
- `studentRegistry.ts` - TypeScript types

**Keep As-Is:**
- `ViewStudentModal.jsx` - basic view (replaced by profile modal later)
- `AddStudentModal.jsx` - manual student addition

This plan transforms the Student Registry into a comprehensive student information system that automatically registers SSC-approved scholars and provides full lifecycle management from enrollment through graduation.
