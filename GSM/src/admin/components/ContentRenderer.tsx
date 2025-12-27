import Dashboard from './modules/Dashboard/DashboardOverview'
import ApplicationManagement from './modules/scholarship/application/ApplicationManagement'
import ScholarshipPrograms from './modules/scholarship/ScholarshipPrograms'
import SSCManagement from './modules/scholarship/ssc/SSCManagement'
import SchoolAidDistribution from './modules/schoolAid/SchoolAidDistribution'
import DisbursementHistory from './modules/schoolAid/DisbursementHistory'
import StudentRegistryOverview from './modules/studentRegistry/StudentRegistryOverview'
import ActiveStudents from './modules/studentRegistry/ActiveStudents'
import ArchivedStudents from './modules/studentRegistry/ArchivedStudents'
import Scholars from './modules/studentRegistry/Scholars'
import BulkOperations from './modules/studentRegistry/BulkOperations'
import ReportsAnalytics from './modules/studentRegistry/ReportsAnalytics'
import ImportExport from './modules/studentRegistry/ImportExport'
import PSDSchoolManagement from './modules/partnerSchool/PSDSchoolManagement'
import PSDStudentPopulation from './modules/partnerSchool/PSDStudentPopulation'
import PSDVerification from './modules/partnerSchool/PSDVerification'
import PSDAnalytics from './modules/partnerSchool/PSDAnalytics'
import PSDSettings from './modules/partnerSchool/PSDSettings'
import UserManagement from './modules/UserManagement/UserManagement'
import AuditLog from './modules/AuditLog/AuditLog'
import { EMROverview, AcademicPerformanceReport, EnrollmentReport, StudentProgressReport, AnalyticsCharts } from './modules/educationMonitoring'
import SettingsOverview from './modules/settings/SettingsOverview'
import InterviewerDashboard from './modules/interviewer/InterviewerDashboard'
import MyInterviews from './modules/interviewer/MyInterviews'
import DocumentSecurityDashboard from './modules/security/DocumentSecurityDashboard'
import ArchivedOverview from './modules/archived/ArchivedOverview'

type Props = { activeItem: string; onPageChange?: (id: string) => void; userRole?: string; userSystemRole?: string }

function ContentRenderer({ activeItem, onPageChange, userRole, userSystemRole }: Props) {
	// Handle access denied case
	if (activeItem === 'access-denied') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
					<p className="text-sm text-gray-500 mb-4">
						You don't have the necessary permissions to access this system. Please contact your administrator.
					</p>
					<button 
						onClick={() => window.location.href = '/'}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Return to Login
					</button>
				</div>
			</div>
		)
	}

	// Check if staff user has no system_role - redirect to access denied
	if (userRole === 'staff' && !userSystemRole) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Staff Access Required</h3>
					<p className="text-sm text-gray-500 mb-4">
						You need to be registered as staff in the scholarship system to access this dashboard. Please contact your administrator.
					</p>
					<button 
						onClick={() => window.location.href = '/'}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Return to Login
					</button>
				</div>
			</div>
		)
	}

	switch (activeItem) {
		case 'dashboard':
			// Show interviewer dashboard for staff with interviewer system role
			if (userRole === 'staff' && userSystemRole === 'interviewer') {
				return <div><InterviewerDashboard /></div>
			}
			return <div><Dashboard /></div>
		case 'Settings':
			return <div><SettingsOverview /></div>
		case 'scholarship-applications':
			return <div><ApplicationManagement /></div>
		case 'scholarship-programs':
			return <div><ScholarshipPrograms /></div>
		case 'scholarship-ssc':
			return <div><SSCManagement /></div>
	case 'sad-overview':
		return <div><SchoolAidDistribution /></div>
	case 'sad-disbursement-history':
		return <div><DisbursementHistory /></div>
		case 'studentRegistry-overview':
			return <div><StudentRegistryOverview /></div>
		case 'studentRegistry-active-students':
			return <div><ActiveStudents /></div>
		case 'studentRegistry-archived-students':
			return <div><ArchivedStudents /></div>
		case 'studentRegistry-scholars':
			return <div><Scholars /></div>
		case 'studentRegistry-bulk-operations':
			return <div><BulkOperations /></div>
		case 'studentRegistry-reports':
			return <div><ReportsAnalytics /></div>
		case 'studentRegistry-import-export':
			return <div><ImportExport /></div>
		case 'psd-school-management':
			return <div><PSDSchoolManagement /></div>
		case 'psd-student-population':
			return <div><PSDStudentPopulation /></div>
		case 'psd-verification':
			return <div><PSDVerification /></div>
		case 'psd-analytics':
			return <div><PSDAnalytics /></div>
		case 'psd-settings':
			return <div><PSDSettings /></div>
		case 'emr-overview':
			return <div><EMROverview /></div>
		case 'emr-academic-performance':
			return <div><AcademicPerformanceReport /></div>
		case 'emr-enrollment-statistics':
			return <div><EnrollmentReport /></div>
		case 'emr-student-progress':
			return <div><StudentProgressReport /></div>
		case 'emr-analytics':
			return <div><AnalyticsCharts /></div>
            case 'user-management':
                return <div><UserManagement /></div>
            case 'audit-logs':
                return <div><AuditLog /></div>
            // Security module routes
            case 'security-dashboard':
                return <div><DocumentSecurityDashboard activeItem="security-dashboard" /></div>
            case 'security-threats':
                return <div><DocumentSecurityDashboard activeItem="security-threats" /></div>
            case 'security-quarantine':
                return <div><DocumentSecurityDashboard activeItem="security-quarantine" /></div>
            case 'security-settings':
                return <div><DocumentSecurityDashboard activeItem="security-settings" /></div>
            case 'settings':
                return <div><SettingsOverview /></div>
            case 'archived':
                return <div><ArchivedOverview /></div>
		// Interviewer routes
		case 'interviews-pending':
			return <div><MyInterviews filter="pending" /></div>
		case 'interviews-completed':
			return <div><MyInterviews filter="completed" /></div>
		case 'interviews-all':
			return <div><MyInterviews filter="all" /></div>
		default:
			return <div>Dashboard</div>
	}
}

export default ContentRenderer 
