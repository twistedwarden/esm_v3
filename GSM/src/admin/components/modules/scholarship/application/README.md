# Application Management Module

This module contains the scholarship application management system with sub-modules similar to the SSC management format.

## Structure

```
application/
├── ApplicationManagement.jsx     # Main component with tab navigation
├── ApplicationOverview.jsx        # Overview dashboard with statistics
├── ScholarshipApplications.jsx   # Application review and management
├── InterviewSchedules.jsx         # Interview scheduling system
├── EndorseToSSC.jsx              # SSC endorsement workflow
└── README.md                     # This file
```

## Components

### ApplicationManagement.jsx
Main component that provides tab navigation between all sub-modules:
- Overview
- Application Review
- Verified Enrolled Students
- Interview Schedules
- Endorse to SSC

### ApplicationOverview.jsx
Dashboard showing:
- Statistics cards for all application stages
- Recent activities feed
- Quick action buttons
- Real-time data updates

### ScholarshipApplications.jsx
Comprehensive application management:
- Advanced filtering and search
- Grid/list view modes
- Bulk operations
- Review modal with approve/compliance/reject actions
- Document management

### VerifiedEnrolledStudents.jsx - REMOVED
Student verification system has been removed - automatic verification is disabled.
Manual verification is now handled by administrators.
- School and academic level filtering
- Verification workflow management

### InterviewSchedules.jsx
Interview management system:
- Online and in-person interview scheduling
- Interviewer assignment
- Meeting link management
- Status tracking (scheduled, completed, cancelled)
- Bulk operations

### EndorseToSSC.jsx
SSC endorsement workflow:
- Applications ready for SSC review
- Verification status tracking
- Endorsement process management
- Priority handling
- Bulk endorsement operations

## Features

- **Consistent UI/UX**: All components follow the same design patterns as SSC management
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Full dark mode compatibility
- **Advanced Filtering**: Comprehensive filtering options for all modules
- **Bulk Operations**: Mass actions for efficiency
- **Real-time Updates**: Live data refresh capabilities
- **Export Functionality**: Data export options
- **Search Integration**: Global search across all modules

## Usage

The module is integrated into the admin panel through the ContentRenderer component. Access it through the scholarship applications menu item in the admin sidebar.

## Dependencies

- React 18+
- Lucide React (icons)
- Tailwind CSS (styling)
- React Router (navigation)

## API Integration

All components are designed to work with the scholarship API service:
- `scholarshipApiService.getApplications()`
- `scholarshipApiService.approveApplication()`
- `scholarshipApiService.rejectApplication()`
- And other related endpoints
