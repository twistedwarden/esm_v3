# SSC (Scholarship Screening Committee) Management Module

This module provides comprehensive management tools for the Scholarship Screening Committee to review applications endorsed by admins and make final approval/rejection decisions.

## Features

### 1. Application Review

- **View Assigned Applications**: SSC members can access a list of pending applications routed to them for evaluation
- **Application Details View**: Shows full applicant data (personal info, academic records, documents, interview results)
- **Scorecard/Evaluation Form**: Form-based rating per criteria (GWA, income bracket, interview rating, leadership)
- **Document Verification Integration**: Displays document verification status from the Scholarship Service

### 2. Decision Workflow

- **Approve/Reject/For Review**: Each SSC member can submit their decision per application
- **Digital Signature**: Official decision confirmation with role-based e-signature
- **Comment & Notes Section**: Allows members to give remarks, justifications, or recommendations
- **Multi-Level Approval**: Supports layered approval (individual → committee → chairperson)
- **Voting/Consensus System**: Automatically tallies decisions for transparency (majority vote approval)

### 3. Appeals Handling

- **View Appeals**: Lists applications flagged for appeal by students
- **Decision Override**: SSC can override previous decisions with justification
- **Appeal Status Tracking**: Tracks resolution and date of final decision

### 4. Policy & Guidelines Management

- **Upload SSC Guidelines**: Admin or Chairperson can update scholarship policy documents
- **Create Evaluation Templates**: Set evaluation criteria (weight, scoring rules)
- **Decision Audit Trail**: Automatically records who made what decision and when

### 5. Collaboration Tools

- **Discussion Threads**: Per-application chat/forum for SSC members
- **Internal Notifications**: Alert SSC when new applications or appeals are ready
- **Meeting Logs**: Record meeting summaries and decisions made

### 6. Reporting & Analytics

- **Approved vs Rejected Applications**: Statistical overview per category, date range, or member
- **Scholar Demographics**: Breakdown by school, course, income level, or district
- **Performance Dashboard**: SSC productivity and turnaround time analytics

## Components

### Main Components

- `SSCManagement.jsx` - Main container component with sub-navigation
- `SSCOverview.jsx` - Dashboard with key metrics and recent activities
- `ApplicationReview.jsx` - Application review and evaluation interface
- `DecisionWorkflow.jsx` - Decision management and approval workflow
- `AppealsHandling.jsx` - Appeals management and decision overrides
- `PolicyGuidelines.jsx` - Policy document and template management
- `CollaborationTools.jsx` - Discussion threads, notifications, and meetings
- `ReportingAnalytics.jsx` - Analytics and reporting dashboard

## Navigation

The SSC module is accessible through:
**Scholarship → SSC Management**

### Sub-navigation tabs:

1. **Overview** - Dashboard with key metrics
2. **Application Review** - Review and evaluate applications
3. **Decision Workflow** - Manage decisions and approvals
4. **Appeals Handling** - Handle student appeals
5. **Policy & Guidelines** - Manage policies and templates
6. **Collaboration Tools** - Discussions and meetings
7. **Reporting & Analytics** - Performance metrics and reports

## Key Features by Category

### Application Review

- ✅ Application listing with filters (status, priority, assigned to)
- ✅ Detailed application view with all student information
- ✅ Evaluation form with scoring criteria
- ✅ Document verification status
- ✅ Assignment to committee members
- ✅ Priority management (high, medium, low)

### Decision Workflow

- ✅ Decision submission (approve/reject/for review)
- ✅ Scoring system (1-10 scale)
- ✅ Comments and justification
- ✅ Digital signature capability
- ✅ Committee voting system
- ✅ Multi-level approval workflow
- ✅ Decision tracking and status updates

### Appeals Handling

- ✅ Appeal listing and filtering
- ✅ Appeal details with original decision
- ✅ Decision override functionality
- ✅ Appeal resolution tracking
- ✅ Justification for overrides
- ✅ Status management (pending, under review, resolved)

### Policy & Guidelines

- ✅ Policy document upload and management
- ✅ Evaluation template creation
- ✅ Audit trail for all changes
- ✅ Version control for policies
- ✅ Category-based organization
- ✅ Download tracking

### Collaboration Tools

- ✅ Discussion threads per application
- ✅ Internal notification system
- ✅ Meeting scheduling and management
- ✅ Meeting minutes recording
- ✅ Participant management
- ✅ Priority-based notifications

### Reporting & Analytics

- ✅ Application statistics and trends
- ✅ Member performance metrics
- ✅ Approval/rejection rates
- ✅ Processing time analytics
- ✅ School and category breakdowns
- ✅ Export capabilities

## Data Structure

### Application Review Data

```javascript
{
  id: 'APP-2024-001',
  studentName: 'Juan Dela Cruz',
  studentId: '2024-001234',
  program: 'Bachelor of Science in Computer Science',
  gwa: 1.25,
  incomeBracket: 'Below 20,000',
  applicationDate: '2024-01-10',
  status: 'pending_review',
  priority: 'high',
  assignedTo: 'Dr. Maria Santos',
  documentsStatus: 'complete',
  interviewScheduled: '2024-01-20',
  category: 'Academic Excellence',
  subcategory: 'Dean\'s List'
}
```

### Decision Data

```javascript
{
  id: 'DEC-2024-001',
  applicationId: 'APP-2024-001',
  studentName: 'Juan Dela Cruz',
  decision: 'pending',
  decisionType: 'approve',
  score: 8.5,
  comments: 'Excellent academic performance and strong financial need.',
  decisionMaker: 'Dr. Maria Santos',
  decisionDate: '2024-01-15',
  approvalLevel: 'individual',
  requiresSignature: true,
  digitalSignature: null,
  committeeVote: null,
  finalStatus: 'pending_committee'
}
```

### Appeal Data

```javascript
{
  id: 'APL-2024-001',
  applicationId: 'APP-2024-001',
  studentName: 'Juan Dela Cruz',
  originalDecision: 'rejected',
  appealReason: 'Additional documents provided',
  appealDate: '2024-01-16',
  status: 'pending',
  priority: 'high',
  assignedTo: 'Dr. Maria Santos',
  originalScore: 6.2,
  newScore: null,
  appealDocuments: ['Additional Transcript', 'Recommendation Letter'],
  committeeReview: null,
  finalDecision: null,
  resolutionDate: null,
  comments: 'Student claims additional academic achievements not considered'
}
```

## Usage

1. **Access the module** through the admin sidebar: Scholarship → SSC Management
2. **Navigate between tabs** using the sub-navigation
3. **Review applications** in the Application Review tab
4. **Make decisions** using the Decision Workflow tab
5. **Handle appeals** in the Appeals Handling tab
6. **Manage policies** in the Policy & Guidelines tab
7. **Collaborate** using the Collaboration Tools tab
8. **View analytics** in the Reporting & Analytics tab

## Integration

The SSC module integrates with:

- Scholarship Service API for application data
- Document verification system
- Notification system
- User authentication and authorization
- File upload and storage system

## Future Enhancements

- Real-time notifications
- Mobile responsiveness
- Advanced analytics and charts
- Automated workflow triggers
- Integration with external systems
- Advanced reporting features
- Bulk operations
- Email notifications
- Calendar integration
