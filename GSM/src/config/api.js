// API Configuration
export const API_CONFIG = {
    AUTH_SERVICE: {
        // Local auth service
        // BASE_URL: 'http://localhost:8000',
        BASE_URL: 'https://auth-educ.goserveph.com',
        ENDPOINTS: {
            LOGIN: '/api/login',
            LOGOUT: '/api/logout',
            USER: '/api/user',
            HEALTH: '/api/health'
        }
    },
    SCHOLARSHIP_SERVICE: {
        BASE_URL: 'http://localhost:8001',
        ENDPOINTS: {
            // Health check
            HEALTH: '/api/health',

            // Public endpoints
            PUBLIC_SCHOOLS: '/api/public/schools',
            PUBLIC_SCHOLARSHIP_CATEGORIES: '/api/public/scholarship-categories',
            PUBLIC_DOCUMENT_TYPES: '/api/public/document-types',
            PUBLIC_REQUIRED_DOCUMENTS: '/api/public/required-documents',

            // Student management
            STUDENTS: '/api/students',
            STUDENT: (id) => `/api/students/${id}`,
            STUDENT_RESTORE: (id) => `/api/students/${id}/restore`,
            STUDENT_FORCE_DELETE: (id) => `/api/students/${id}/force-delete`,

            // Scholarship applications
            APPLICATIONS: '/api/applications',
            APPLICATION: (id) => `/api/applications/${id}`,
            APPLICATION_SUBMIT: (id) => `/api/applications/${id}/submit`,
            APPLICATION_APPROVE: (id) => `/api/applications/${id}/approve`,
            APPLICATION_REJECT: (id) => `/api/applications/${id}/reject`,
            APPLICATION_REVIEW: (id) => `/api/applications/${id}/review`,
            APPLICATION_COMPLIANCE: (id) => `/api/applications/${id}/compliance`,

            // Document management
            DOCUMENTS: '/api/documents',
            DOCUMENT: (id) => `/api/documents/${id}`,
            DOCUMENT_VIEW: (id) => `/api/documents/${id}/view`,
            DOCUMENT_DOWNLOAD: (id) => `/api/documents/${id}/download`,
            DOCUMENT_VERIFY: (id) => `/api/documents/${id}/verify`,
            DOCUMENT_REJECT: (id) => `/api/documents/${id}/reject`,

            // School management
            SCHOOLS: '/api/schools',
            SCHOOL: (id) => `/api/schools/${id}`,

            // Scholarship categories
            SCHOLARSHIP_CATEGORIES: '/api/scholarship-categories',
            SCHOLARSHIP_CATEGORY: (id) => `/api/scholarship-categories/${id}`,

            // Scholarship subcategories
            SCHOLARSHIP_SUBCATEGORIES: '/api/scholarship-subcategories',
            SCHOLARSHIP_SUBCATEGORY: (id) => `/api/scholarship-subcategories/${id}`,

            // Form integration
            FORM_NEW_APPLICATION: '/api/forms/new-application',
            FORM_RENEWAL_APPLICATION: '/api/forms/renewal-application',
            FORM_UPLOAD_DOCUMENT: '/api/forms/upload-document',
            FORM_APPLICATION_DATA: (id) => `/api/forms/application/${id}/data`,
            FORM_STUDENT_DATA: (id) => `/api/forms/student/${id}/data`,

            // Statistics
            STATS_OVERVIEW: '/api/stats/overview',
            STATS_APPLICATIONS_BY_STATUS: '/api/stats/applications/by-status',
            STATS_APPLICATIONS_BY_TYPE: '/api/stats/applications/by-type',
            STATS_APPLICATIONS_BY_SUBCATEGORY: '/api/stats/applications/by-subcategory',

            // Enrollment Verification - Removed (automatic verification disabled)

            // Interview Schedules
            INTERVIEW_SCHEDULES: '/api/interview-schedules',
            INTERVIEW_SCHEDULE: (id) => `/api/interview-schedules/${id}`,
            INTERVIEW_SCHEDULE_RESCHEDULE: (id) => `/api/interview-schedules/${id}/reschedule`,
            INTERVIEW_SCHEDULE_COMPLETE: (id) => `/api/interview-schedules/${id}/complete`,
            INTERVIEW_SCHEDULE_CANCEL: (id) => `/api/interview-schedules/${id}/cancel`,
            INTERVIEW_SCHEDULE_NO_SHOW: (id) => `/api/interview-schedules/${id}/no-show`,
            INTERVIEW_AVAILABLE_SLOTS: '/api/interview-schedules/available-slots',
            INTERVIEW_CALENDAR: '/api/interview-schedules/calendar',

            // Application Workflow Extensions
            APPLICATION_APPROVE_VERIFICATION: (id) => `/api/applications/${id}/approve-for-verification`,
            APPLICATION_VERIFY_ENROLLMENT: (id) => `/api/applications/${id}/verify-enrollment`,
            APPLICATION_SCHEDULE_INTERVIEW: (id) => `/api/applications/${id}/schedule-interview`,
            APPLICATION_SCHEDULE_INTERVIEW_AUTO: (id) => `/api/applications/${id}/schedule-interview-auto`,
            APPLICATION_COMPLETE_INTERVIEW: (id) => `/api/applications/${id}/complete-interview`
        }
    },
    AID_SERVICE: {
        BASE_URL: 'http://localhost:8002',
        ENDPOINTS: {
            // Health check
            HEALTH: '/api/health',

            // School Aid applications
            APPLICATIONS: '/api/school-aid/applications',
            APPLICATION_STATUS: (id) => `/api/school-aid/applications/${id}/status`,
            APPLICATION_PROCESS_GRANT: (id) => `/api/school-aid/applications/${id}/process-grant`,
            APPLICATIONS_BATCH_UPDATE: '/api/school-aid/applications/batch-update',

            // Payments
            PAYMENTS: '/api/school-aid/payments',
            PAYMENT_PROCESS: '/api/school-aid/payments/process',
            PAYMENT_RETRY: (id) => `/api/school-aid/payments/${id}/retry`,

            // Metrics and Analytics
            METRICS: '/api/school-aid/metrics',
            ANALYTICS: (type) => `/api/school-aid/analytics/${type}`,

            // Settings
            SETTINGS: '/api/school-aid/settings',
            SETTINGS_TEST: (type) => `/api/school-aid/settings/test/${type}`
        }
    },
    MONITORING_SERVICE: {
        BASE_URL: 'http://localhost:8003',
        ENDPOINTS: {
            // Health check
            HEALTH: '/api/health'
        }
    }
};

// Helper function to get full API URL for auth service
export const getAuthServiceUrl = (endpoint) => {
    return `${API_CONFIG.AUTH_SERVICE.BASE_URL}${endpoint}`;
};

// Helper function to get full API URL for scholarship service
export const getScholarshipServiceUrl = (endpoint) => {
    return `${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}${endpoint}`;
};

// Helper function to get full API URL for aid service
export const getAidServiceUrl = (endpoint) => {
    return `${API_CONFIG.AID_SERVICE.BASE_URL}${endpoint}`;
};

// Helper function to get full API URL for monitoring service
export const getMonitoringServiceUrl = (endpoint) => {
    return `${API_CONFIG.MONITORING_SERVICE.BASE_URL}${endpoint}`;
};

// Helper function to get full API URL for any service
export const getServiceUrl = (service, endpoint) => {
    const serviceConfig = API_CONFIG[service];
    if (!serviceConfig) {
        throw new Error(`Unknown service: ${service}`);
    }
    return `${serviceConfig.BASE_URL}${endpoint}`;
};

// Helper function to check if a service is available
export const isServiceAvailable = (service) => {
    return !!API_CONFIG[service];
};

// Legacy helper function for backward compatibility
export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.AUTH_SERVICE.BASE_URL}${endpoint}`;
};