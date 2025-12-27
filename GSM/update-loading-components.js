const fs = require('fs');
const path = require('path');

// List of admin modules that need loading component updates
const modulesToUpdate = [
  'GSM/src/admin/components/modules/scholarship/application/ScholarshipApplications.jsx',
  'GSM/src/admin/components/modules/scholarship/application/ApplicationOverview.jsx',
  'GSM/src/admin/components/modules/scholarship/application/InterviewSchedules.jsx',
  'GSM/src/admin/components/modules/scholarship/application/EndorseToSSC.jsx',
  'GSM/src/admin/components/modules/scholarship/ScholarshipPrograms.jsx',
  'GSM/src/admin/components/modules/scholarship/ScholarshipOverview.jsx',
  'GSM/src/admin/components/modules/studentRegistry/StudentRegistryOverview.jsx',
  'GSM/src/admin/components/modules/studentRegistry/ActiveStudents.jsx',
  'GSM/src/admin/components/modules/studentRegistry/Scholars.jsx',
  'GSM/src/admin/components/modules/studentRegistry/ArchivedStudents.jsx',
  'GSM/src/admin/components/modules/studentRegistry/ReportsAnalytics.jsx',
  'GSM/src/admin/components/modules/studentRegistry/ImportExport.jsx',
  'GSM/src/admin/components/modules/studentRegistry/BulkOperations.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDOverview.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDSchoolManagement.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDStudentPopulation.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDVerification.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDProgramsPartnerships.jsx',
  'GSM/src/admin/components/modules/partnerSchool/PSDAnalytics.jsx',
  'GSM/src/admin/components/modules/schoolAid/SADApplications.jsx',
  'GSM/src/admin/components/modules/schoolAid/FundAllocation.jsx',
  'GSM/src/admin/components/modules/schoolAid/PaymentProcessing.jsx',
  'GSM/src/admin/components/modules/schoolAid/SADDistributionLogs.jsx',
  'GSM/src/admin/components/modules/schoolAid/Analytics.jsx',
  'GSM/src/admin/components/modules/educationMonitoring/overview/EMROverview.jsx',
  'GSM/src/admin/components/modules/educationMonitoring/studentProgress/StudentProgressReport.jsx',
  'GSM/src/admin/components/modules/educationMonitoring/enrollmentStatistics/EnrollmentReport.jsx',
  'GSM/src/admin/components/modules/educationMonitoring/academicPerformance/AcademicPerformanceReport.jsx',
  'GSM/src/admin/components/modules/interviewer/InterviewerDashboard.jsx',
  'GSM/src/admin/components/modules/interviewer/MyInterviews.jsx',
  'GSM/src/admin/components/modules/security/DocumentSecurityDashboard.jsx'
];

// Loading component mapping based on module type
const getLoadingComponent = (filePath) => {
  if (filePath.includes('scholarship') || filePath.includes('application')) {
    return 'LoadingApplications';
  } else if (filePath.includes('student') || filePath.includes('scholar')) {
    return 'LoadingStudents';
  } else if (filePath.includes('user') || filePath.includes('User')) {
    return 'LoadingUsers';
  } else if (filePath.includes('dashboard') || filePath.includes('Dashboard')) {
    return 'LoadingDashboard';
  } else {
    return 'LoadingData';
  }
};

// Function to update a single file
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has LoadingSpinner import
    if (content.includes('LoadingSpinner')) {
      console.log(`Already updated: ${filePath}`);
      return;
    }

    // Find the lucide-react import line
    const lucideImportMatch = content.match(/} from 'lucide-react';/);
    if (!lucideImportMatch) {
      console.log(`No lucide-react import found in: ${filePath}`);
      return;
    }

    // Add LoadingSpinner import
    const loadingComponent = getLoadingComponent(filePath);
    content = content.replace(
      /} from 'lucide-react';/,
      `} from 'lucide-react';\nimport { ${loadingComponent} } from '../../ui/LoadingSpinner';`
    );

    // Replace common loading patterns
    const loadingPatterns = [
      // Pattern 1: Full loading div with spinner and text
      {
        regex: /if\s*\(\s*loading\s*\)\s*{\s*return\s*\(\s*<div[^>]*className="[^"]*flex[^"]*items-center[^"]*justify-center[^"]*h-\d+[^"]*"[^>]*>\s*<div[^>]*className="[^"]*text-center[^"]*"[^>]*>\s*<div[^>]*className="[^"]*animate-spin[^"]*"[^>]*><\/div>\s*<p[^>]*className="[^"]*mt-\d+[^"]*text-gray-[^"]*"[^>]*>[^<]*<\/p>\s*<\/div>\s*<\/div>\s*\);\s*}/gs,
        replacement: `if (loading) {\n        return <${loadingComponent} />;\n    }`
      },
      // Pattern 2: Simple loading with spinner
      {
        regex: /if\s*\(\s*loading\s*\)\s*{\s*return\s*\(\s*<div[^>]*className="[^"]*flex[^"]*items-center[^"]*justify-center[^"]*"[^>]*>\s*<div[^>]*className="[^"]*animate-spin[^"]*"[^>]*><\/div>\s*<\/div>\s*\);\s*}/gs,
        replacement: `if (loading) {\n        return <${loadingComponent} />;\n    }`
      },
      // Pattern 3: Loading with RefreshCw icon
      {
        regex: /if\s*\(\s*loading\s*\)\s*{\s*return\s*\(\s*<div[^>]*className="[^"]*flex[^"]*items-center[^"]*justify-center[^"]*"[^>]*>\s*<div[^>]*className="[^"]*text-center[^"]*"[^>]*>\s*<RefreshCw[^>]*className="[^"]*animate-spin[^"]*"[^>]*\/>\s*<p[^>]*className="[^"]*text-gray-[^"]*"[^>]*>[^<]*<\/p>\s*<\/div>\s*<\/div>\s*\);\s*}/gs,
        replacement: `if (loading) {\n        return <${loadingComponent} />;\n    }`
      }
    ];

    let updated = false;
    for (const pattern of loadingPatterns) {
      if (pattern.regex.test(content)) {
        content = content.replace(pattern.regex, pattern.replacement);
        updated = true;
        break;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    } else {
      console.log(`No loading pattern found in: ${filePath}`);
    }

  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log('Starting loading component updates...');
modulesToUpdate.forEach(updateFile);
console.log('Loading component updates completed!');
