<?php

use Illuminate\Http\Request;

// Test route at the top
Route::get('/test-top', function () {
    return response()->json(['message' => 'Top test route works']);
});

// Temporary public test endpoint for staff interviewers
Route::get('/test-staff-interviewers', function () {
    try {
        $interviewers = \App\Models\Staff::getActiveInterviewersWithUserData();
        return response()->json([
            'success' => true,
            'data' => $interviewers,
            'message' => 'Test endpoint - Interviewers retrieved successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Test endpoint - Failed to retrieve interviewers: ' . $e->getMessage()
        ], 500);
    }
});

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ScholarshipApplicationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\ScholarshipCategoryController;
use App\Http\Controllers\Api\PartnerSchoolController;
use App\Http\Controllers\EnrollmentVerificationController;
use App\Http\Controllers\InterviewScheduleController;
use App\Http\Controllers\InterviewEvaluationController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\ArchivedDataController;

// Public staff interviewers endpoint (temporarily for debugging)
Route::get('/staff/interviewers', [StaffController::class, 'getInterviewers']);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Scholarship Service API'
    ]);
});

// SSC Assignment routes
Route::prefix('ssc-assignments')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\SSCAssignmentController::class, 'index']);
    Route::get('/user/{userId}', [App\Http\Controllers\Api\SSCAssignmentController::class, 'getUserAssignments']);
    Route::post('/', [App\Http\Controllers\Api\SSCAssignmentController::class, 'store']);
    Route::put('/{id}', [App\Http\Controllers\Api\SSCAssignmentController::class, 'update']);
    Route::delete('/{id}', [App\Http\Controllers\Api\SSCAssignmentController::class, 'destroy']);
});

// Public routes (no authentication required)
Route::prefix('public')->group(function () {
    // Get reference data
    Route::get('/schools', [SchoolController::class, 'index']);
    Route::get('/scholarship-categories', [ScholarshipCategoryController::class, 'index']);
    Route::get('/document-types', [DocumentController::class, 'getDocumentTypes']);
    Route::get('/required-documents', [DocumentController::class, 'getRequiredDocuments']);

    // Staff verification endpoint for auth service
    Route::get('/staff/verify/{userId}', [StaffController::class, 'verifyStaff']);
});

// Staff endpoints for auth service to fetch staff details
Route::get('/staff/user/{userId}', [StaffController::class, 'getStaffByUserId']);

// Public student routes (must be before protected students group to avoid conflicts)
Route::get('/students/statistics', [StudentController::class, 'getStatistics']);
Route::get('/students', [StudentController::class, 'index']);
Route::get('/students/scholarship-status/{status}', [StudentController::class, 'getByScholarshipStatus']);

// Public application routes for notifications
Route::get('/applications/counts', [ScholarshipApplicationController::class, 'getApplicationCounts']);
Route::get('/students/debug', function () {
    $count = \App\Models\Student::count();
    $students = \App\Models\Student::select('id', 'first_name', 'last_name', 'user_id', 'created_at')->take(5)->get();
    $paginated = \App\Models\Student::orderBy('created_at', 'desc')->paginate(15);

    // Test the exact same query as the index method
    $query = \App\Models\Student::query();
    $indexQuery = $query->orderBy('created_at', 'desc')->paginate(15);

    // Test the index method directly
    $controller = new \App\Http\Controllers\StudentController();
    $request = new \Illuminate\Http\Request();
    $indexResult = $controller->index($request);

    return response()->json([
        'count' => $count,
        'students' => $students,
        'paginated' => $paginated,
        'index_query' => $indexQuery,
        'index_result' => $indexResult->getData()
    ]);
});

// Student routes (protected by authentication)
Route::prefix('students')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [StudentController::class, 'index']);
    Route::post('/', [StudentController::class, 'store']);
    Route::get('/{student}', [StudentController::class, 'show']);
    Route::put('/{student}', [StudentController::class, 'update']);
    Route::delete('/{student}', [StudentController::class, 'destroy']);

    // Auto-registration from SSC approval
    Route::post('/register-from-scholarship', [StudentController::class, 'registerFromScholarship']);
    Route::get('/check-by-application/{applicationId}', [StudentController::class, 'checkByApplication']);
    Route::get('/by-application/{applicationId}', [StudentController::class, 'getByApplication']);

});

// Scholarship Application routes (protected by authentication)
Route::prefix('applications')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [ScholarshipApplicationController::class, 'index']);
    Route::post('/', [ScholarshipApplicationController::class, 'store']);
    Route::get('/{application}', [ScholarshipApplicationController::class, 'show']);
    Route::put('/{application}', [ScholarshipApplicationController::class, 'update']);
    Route::delete('/{application}', [ScholarshipApplicationController::class, 'destroy']);

    // Application actions
    Route::post('/{application}/submit', [ScholarshipApplicationController::class, 'submit']);
    Route::post('/{application}/review', [ScholarshipApplicationController::class, 'review']);
    Route::post('/{application}/compliance', [ScholarshipApplicationController::class, 'flagForCompliance']);
    Route::post('/{application}/approve', [ScholarshipApplicationController::class, 'approve']);
    Route::post('/{application}/reject', [ScholarshipApplicationController::class, 'reject']);

    // New workflow actions
    Route::post('/{application}/approve-for-verification', [ScholarshipApplicationController::class, 'approveForVerification']);
    Route::post('/{application}/verify-enrollment', [ScholarshipApplicationController::class, 'verifyEnrollment']);
    Route::post('/{application}/schedule-interview', [ScholarshipApplicationController::class, 'scheduleInterview']);
    Route::post('/{application}/schedule-interview-auto', [ScholarshipApplicationController::class, 'scheduleInterviewAuto']);
    Route::post('/{application}/complete-interview', [ScholarshipApplicationController::class, 'completeInterview']);
    Route::post('/{application}/endorse-to-ssc', [ScholarshipApplicationController::class, 'endorseToSSC']);

    // Bulk operations
    Route::post('/bulk-endorse-to-ssc', [ScholarshipApplicationController::class, 'bulkEndorseToSSC']);

    // SSC operations (legacy)
    Route::get('/ssc/pending', [ScholarshipApplicationController::class, 'getSscPendingApplications']);
    Route::get('/ssc/statistics', [ScholarshipApplicationController::class, 'getSscStatistics']);
    Route::get('/ssc/decision-history', [ScholarshipApplicationController::class, 'getSscDecisionHistory']);
    Route::get('/ssc/all-decisions', [ScholarshipApplicationController::class, 'getAllSscDecisions']);
    Route::post('/{application}/ssc-approve', [ScholarshipApplicationController::class, 'sscApprove']);
    Route::post('/{application}/ssc-reject', [ScholarshipApplicationController::class, 'sscReject']);
    Route::post('/ssc/bulk-approve', [ScholarshipApplicationController::class, 'sscBulkApprove']);
    Route::post('/ssc/bulk-reject', [ScholarshipApplicationController::class, 'sscBulkReject']);

    // SSC Multi-Stage Workflow (new)
    Route::get('/ssc/stage/{stage}', [ScholarshipApplicationController::class, 'getSscApplicationsByStage']);
    Route::get('/ssc/my-applications', [ScholarshipApplicationController::class, 'getMySscApplications']);

    // Stage-specific reviews
    Route::post('/{application}/ssc/document-verification', [ScholarshipApplicationController::class, 'sscSubmitDocumentVerification']);
    Route::post('/{application}/ssc/financial-review', [ScholarshipApplicationController::class, 'sscSubmitFinancialReview']);
    Route::post('/{application}/ssc/academic-review', [ScholarshipApplicationController::class, 'sscSubmitAcademicReview']);
    Route::post('/{application}/ssc/final-approval', [ScholarshipApplicationController::class, 'sscFinalApproval']);
    Route::post('/{application}/ssc/final-rejection', [ScholarshipApplicationController::class, 'sscFinalRejection']);

    // Request revision
    Route::post('/{application}/ssc/request-revision', [ScholarshipApplicationController::class, 'sscRequestRevision']);

    // Get review history
    Route::get('/{application}/ssc/review-history', [ScholarshipApplicationController::class, 'getSscReviewHistory']);

    // Get current user's SSC roles
    Route::get('/ssc/my-roles', [ScholarshipApplicationController::class, 'getUserSscRoles']);

    // Parallel stage approval
    Route::post('/{application}/approve-stage', [ScholarshipApplicationController::class, 'approveStage']);

    // Get SSC member assignments
    Route::get('/ssc/member-assignments', [ScholarshipApplicationController::class, 'getSscMemberAssignments']);
});

// Interviewer routes (for staff with interviewer system role)
Route::prefix('interviewer')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/my-interviews', [App\Http\Controllers\InterviewController::class, 'getMyInterviews']);
    Route::get('/statistics', [App\Http\Controllers\InterviewController::class, 'getInterviewerStatistics']);
    Route::post('/interviews/{schedule}/evaluate', [App\Http\Controllers\InterviewController::class, 'submitEvaluation']);
});

// Document routes
Route::prefix('documents')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [DocumentController::class, 'index']);
    Route::post('/', [DocumentController::class, 'store']);
    Route::get('/{document}', [DocumentController::class, 'show']);
    Route::delete('/{document}', [DocumentController::class, 'destroy']);
    Route::get('/{document}/view', [DocumentController::class, 'view']);
    Route::get('/{document}/download', [DocumentController::class, 'download']);
    Route::post('/{document}/verify', [DocumentController::class, 'verify']);
    Route::post('/{document}/reject', [DocumentController::class, 'reject']);

    // Document utilities
    Route::get('/types/list', [DocumentController::class, 'getDocumentTypes']);
    Route::get('/required', [DocumentController::class, 'getRequiredDocuments']);
    Route::get('/checklist', [DocumentController::class, 'getDocumentsChecklist']);

    // Document security endpoints
    Route::get('/{document}/scan-status', [DocumentController::class, 'getScanStatus']);
});

// Virus scan monitoring routes (admin only)
Route::prefix('virus-scan')->group(function () {
    Route::get('/statistics', [App\Http\Controllers\VirusScanController::class, 'statistics']);
    Route::get('/logs', [App\Http\Controllers\VirusScanController::class, 'logs']);
    Route::get('/quarantine', [App\Http\Controllers\VirusScanController::class, 'quarantineList']);
    Route::post('/quarantine/{quarantineId}/review', [App\Http\Controllers\VirusScanController::class, 'reviewQuarantinedFile']);
    Route::delete('/quarantine/{quarantineId}', [App\Http\Controllers\VirusScanController::class, 'deleteQuarantinedFile']);
});

// Test route
Route::get('/test-security', function () {
    return response()->json(['message' => 'Security API is working']);
});

// Simple test route
Route::get('/test-simple', function () {
    return 'Simple test works';
});

// Public test upload route (for testing only)
Route::post('/test-upload', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'Test upload endpoint is working',
        'data' => [
            'has_file' => $request->hasFile('file'),
            'all_keys' => array_keys($request->all()),
            'headers' => $request->headers->all()
        ]
    ]);
});


// School routes
Route::prefix('schools')->group(function () {
    Route::get('/', [SchoolController::class, 'index']);
    Route::post('/', [SchoolController::class, 'store'])->middleware(['auth.auth_service']);
    Route::get('/{school}', [SchoolController::class, 'show']);
    Route::put('/{school}', [SchoolController::class, 'update'])->middleware(['auth.auth_service']);
    Route::delete('/{school}', [SchoolController::class, 'destroy'])->middleware(['auth.auth_service']);
});

// Scholarship Category routes
Route::prefix('scholarship-categories')->group(function () {
    Route::get('/', [ScholarshipCategoryController::class, 'index']);
    Route::post('/', [ScholarshipCategoryController::class, 'store'])->middleware(['auth.auth_service']);
    Route::get('/{category}', [ScholarshipCategoryController::class, 'show']);
    Route::put('/{category}', [ScholarshipCategoryController::class, 'update'])->middleware(['auth.auth_service']);
    Route::delete('/{category}', [ScholarshipCategoryController::class, 'destroy'])->middleware(['auth.auth_service']);
});


// Enrollment Verification routes have been removed - automatic verification is disabled

// Interview Schedule routes (protected by authentication)
Route::prefix('interview-schedules')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [InterviewScheduleController::class, 'index']);
    Route::get('/{schedule}', [InterviewScheduleController::class, 'show']);
    Route::post('/', [InterviewScheduleController::class, 'store']);
    Route::put('/{schedule}/reschedule', [InterviewScheduleController::class, 'reschedule']);
    Route::post('/{schedule}/complete', [InterviewScheduleController::class, 'complete']);
    Route::post('/{schedule}/cancel', [InterviewScheduleController::class, 'cancel']);
    Route::post('/{schedule}/no-show', [InterviewScheduleController::class, 'markNoShow']);
    Route::get('/available-slots', [InterviewScheduleController::class, 'availableSlots']);
    Route::get('/calendar', [InterviewScheduleController::class, 'calendar']);
});

// Interview Evaluation routes (protected by authentication)
Route::prefix('interview-evaluations')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [InterviewEvaluationController::class, 'index']);
    Route::post('/', [InterviewEvaluationController::class, 'store']);
    Route::get('/statistics', [InterviewEvaluationController::class, 'statistics']);
    Route::get('/application/{applicationId}', [InterviewEvaluationController::class, 'getByApplication']);
    Route::get('/student/{studentId}', [InterviewEvaluationController::class, 'getByStudent']);
    Route::get('/{id}', [InterviewEvaluationController::class, 'show']);
    Route::put('/{id}', [InterviewEvaluationController::class, 'update']);
    Route::delete('/{id}', [InterviewEvaluationController::class, 'destroy']);
});

// Staff routes (protected by authentication)
Route::prefix('staff')->middleware(['auth.auth_service'])->group(function () {
    // Temporarily make interviewers endpoint public for debugging
    // Route::get('/interviewers', [StaffController::class, 'getInterviewers']);
    Route::get('/', [StaffController::class, 'getAllStaff']);
    Route::get('/user/{userId}', [StaffController::class, 'getStaffByUserId']);
    Route::get('/{id}', [StaffController::class, 'getStaffById']);
    Route::post('/', [StaffController::class, 'store']);
    Route::put('/{id}', [StaffController::class, 'update']);
});

// User Management routes (protected by authentication - admin only)
Route::prefix('users')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [App\Http\Controllers\Api\UserManagementController::class, 'getAllUsers']);
    Route::get('/role/{role}', [App\Http\Controllers\Api\UserManagementController::class, 'getUsersByRole']);
    Route::get('/stats', [App\Http\Controllers\Api\UserManagementController::class, 'getUserStats']);
    Route::get('/{id}', [App\Http\Controllers\Api\UserManagementController::class, 'getUserById']);
    Route::post('/', [App\Http\Controllers\Api\UserManagementController::class, 'createUser']);
    Route::put('/{id}', [App\Http\Controllers\Api\UserManagementController::class, 'updateUser']);
    Route::delete('/{id}', [App\Http\Controllers\Api\UserManagementController::class, 'deleteUser']);
    Route::put('/{id}/activate', [App\Http\Controllers\Api\UserManagementController::class, 'activateUser']);
    Route::delete('/{id}/permanent', [App\Http\Controllers\Api\UserManagementController::class, 'permanentDeleteUser']);
});

// Audit Log routes (protected by authentication - admin only)
Route::prefix('audit-logs')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [App\Http\Controllers\Api\AuditLogController::class, 'index']);
    Route::get('/statistics', [App\Http\Controllers\Api\AuditLogController::class, 'statistics']);
    Route::get('/recent', [App\Http\Controllers\Api\AuditLogController::class, 'recent']);
    Route::get('/filter-options', [App\Http\Controllers\Api\AuditLogController::class, 'filterOptions']);
    Route::get('/export', [App\Http\Controllers\Api\AuditLogController::class, 'export']);
    Route::get('/user/{userId}', [App\Http\Controllers\Api\AuditLogController::class, 'byUser']);
    Route::get('/resource/{resourceType}/{resourceId}', [App\Http\Controllers\Api\AuditLogController::class, 'byResource']);
    Route::get('/{id}', [App\Http\Controllers\Api\AuditLogController::class, 'show']);
});

// Archived Data routes (protected by authentication - admin only)
Route::prefix('archived')->middleware(['auth.auth_service'])->group(function () {
    Route::get('/', [ArchivedDataController::class, 'getArchivedData']);
    Route::get('/stats', [ArchivedDataController::class, 'getArchivedStats']);
    Route::get('/search', [ArchivedDataController::class, 'searchArchivedData']);
    Route::get('/{category}', [ArchivedDataController::class, 'getArchivedDataByCategory']);
    Route::post('/{category}/{itemId}/restore', [ArchivedDataController::class, 'restoreItem']);
    Route::delete('/{category}/{itemId}', [ArchivedDataController::class, 'permanentDeleteItem']);
    Route::post('/{category}/bulk-restore', [ArchivedDataController::class, 'bulkRestoreItems']);
    Route::post('/{category}/bulk-delete', [ArchivedDataController::class, 'bulkPermanentDeleteItems']);
    Route::get('/{category}/{itemId}', [ArchivedDataController::class, 'getArchivedItemDetails']);
});

// Test endpoint for debugging (remove in production)
Route::get('/test/users', function () {
    try {
        $authServiceUrl = config('services.auth_service.url', 'http://localhost:8001');
        $response = \Illuminate\Support\Facades\Http::timeout(10)
            ->get("{$authServiceUrl}/api/users");

        return response()->json([
            'success' => true,
            'auth_service_url' => $authServiceUrl,
            'auth_service_status' => $response->status(),
            'auth_service_response' => $response->json(),
            'message' => 'Test endpoint working'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'message' => 'Test endpoint failed'
        ], 500);
    }
});

// Partner School Enrollment Data Management routes have been removed - automatic verification is disabled

// Form-specific endpoints for easy integration (protected by authentication)
Route::prefix('forms')->middleware(['auth.auth_service'])->group(function () {
    // New Application Form
    Route::post('/new-application', function (Request $request) {
        $studentController = new StudentController();
        $applicationController = new ScholarshipApplicationController();

        // First create the student
        $studentResponse = $studentController->store($request);
        $studentData = json_decode($studentResponse->getContent(), true);

        if (!$studentData['success']) {
            return $studentResponse;
        }

        // Then create the application
        $request->merge(['student_id' => $studentData['data']['id']]);
        $applicationResponse = $applicationController->store($request);
        $applicationData = json_decode($applicationResponse->getContent(), true);

        if (!$applicationData['success']) {
            return $applicationResponse;
        }

        // Do not auto-submit; leave status as draft so user can finish later

        return $applicationResponse;
    });

    // Renewal Application Form
    Route::post('/renewal-application', function (Request $request) {
        $applicationController = new ScholarshipApplicationController();

        // Set type to renewal
        $request->merge(['type' => 'renewal']);

        $applicationResponse = $applicationController->store($request);
        $applicationData = json_decode($applicationResponse->getContent(), true);

        if (!$applicationData['success']) {
            return $applicationResponse;
        }

        // Automatically submit the application
        $application = \App\Models\ScholarshipApplication::find($applicationData['data']['id']);
        if ($application) {
            $application->submit();
        }

        return $applicationResponse;
    });

    // Document Upload - Fixed route
    Route::post('/upload-document', [DocumentController::class, 'store']);

    // Test route
    Route::get('/test-forms', function () {
        return response()->json(['message' => 'Forms group is working']);
    });

    // Get form data for editing
    Route::get('/application/{application}/data', [ScholarshipApplicationController::class, 'show']);
    Route::get('/student/{student}/data', [StudentController::class, 'show']);
});

// Statistics and reporting endpoints
Route::prefix('stats')->group(function () {
    Route::get('/overview', function () {
        // Calculate real processing speed from approved applications
        // (Time between submission and approval)
        $avgProcessingDays = \App\Models\ScholarshipApplication::whereNotNull('approved_at')
            ->whereNotNull('submitted_at')
            ->selectRaw('AVG(datediff(approved_at, submitted_at)) as avg_days') // Use generic syntax if possible, assume MySQL/Standard SQL datediff for now
            // Fallback for SQLite/others if needed, but usually production is MySQL
            ->first()
            ->avg_days ?? 3.2;

        // If above failed due to platform-specific SQL, try a manual calculation
        if (config('database.default') === 'sqlite') {
            $avgProcessingDays = \App\Models\ScholarshipApplication::whereNotNull('approved_at')
                ->whereNotNull('submitted_at')
                ->get()
                ->avg(function ($app) {
                    return $app->approved_at->diffInDays($app->submitted_at);
                }) ?? 3.2;
        }

        $stats = [
            'total_students' => \App\Models\Student::count(),
            'total_applications' => \App\Models\ScholarshipApplication::count(),
            'pending_applications' => \App\Models\ScholarshipApplication::whereNotIn('status', ['approved', 'rejected', 'grants_disbursed', 'draft'])->count(),
            'approved_applications' => \App\Models\ScholarshipApplication::where('status', 'approved')->count(),
            'total_documents' => \App\Models\Document::count(),
            'verified_documents' => \App\Models\Document::where('status', 'verified')->count(),
            'avg_processing_days' => round($avgProcessingDays, 1),
            'actionable_count' => \App\Models\ScholarshipApplication::whereIn('status', ['submitted', 'documents_reviewed', 'interview_scheduled', 'interview_completed', 'endorsed_to_ssc'])->count(),
            'critical_count' => \App\Models\ScholarshipApplication::whereIn('status', ['rejected', 'for_compliance'])->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    });

    Route::get('/applications/by-status', function () {
        $statusCounts = \App\Models\ScholarshipApplication::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'success' => true,
            'data' => $statusCounts
        ]);
    });

    Route::get('/applications/by-type', function () {
        $typeCounts = \App\Models\ScholarshipApplication::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        return response()->json([
            'success' => true,
            'data' => $typeCounts
        ]);
    });

    Route::get('/applications/by-subcategory', function () {
        $counts = \App\Models\ScholarshipApplication::selectRaw('subcategory_id, COUNT(*) as count')
            ->whereIn('status', ['approved', 'grants_processing', 'grants_disbursed', 'interview_completed', 'endorsed_to_ssc'])
            ->whereNotNull('subcategory_id')
            ->groupBy('subcategory_id')
            ->pluck('count', 'subcategory_id');

        return response()->json([
            'success' => true,
            'data' => $counts
        ]);
    });

    Route::get('/applications/trends', function () {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $months[] = now()->subMonths($i)->format('M');
        }

        $trends = [];
        foreach ($months as $index => $monthName) {
            $date = now()->subMonths(5 - $index);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            // Total applications submitted in this month
            $newCount = \App\Models\ScholarshipApplication::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

            // Total applications approved in this month
            $approvedCount = \App\Models\ScholarshipApplication::whereBetween('approved_at', [$startOfMonth, $endOfMonth])->count();

            $trends[] = [
                'month' => $monthName,
                'applications' => $newCount,
                'approved' => $approvedCount
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'monthly' => $trends
            ]
        ]);
    });
});

// CORS middleware for frontend integration
Route::middleware(['cors'])->group(function () {
    // All routes above will have CORS headers
});

// CORS preflight catch-all for API
Route::options('/{any}', function (Request $request) {
    return response('', 204);
})->where('any', '.*');

// Fallback route
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'available_endpoints' => [
            'GET /api/health',
            'GET /api/public/schools',
            'GET /api/public/scholarship-categories',
            'GET /api/public/document-types',
            'GET /api/students',
            'POST /api/students',
            'GET /api/applications',
            'POST /api/applications',
            'POST /api/forms/new-application',
            'POST /api/forms/renewal-application',
            'POST /api/forms/upload-document',
            'GET /api/stats/overview'
        ]
    ], 404);
});

// Partner School routes (for PS reps) - Authentication handled manually via auth service
Route::prefix('partner-school')->group(function () {
    Route::get('/stats', [PartnerSchoolController::class, 'getStats']);
    Route::get('/students', [PartnerSchoolController::class, 'getStudents']);
    Route::get('/enrollment/data', [PartnerSchoolController::class, 'getEnrollmentData']);
    Route::post('/enrollment/upload', [PartnerSchoolController::class, 'uploadEnrollmentData']);
    Route::get('/school/stats', [PartnerSchoolController::class, 'getSchoolStats']);
    Route::delete('/upload-batch/{batchId}', [PartnerSchoolController::class, 'deleteUploadBatch']);
    Route::post('/flexible/upload', [PartnerSchoolController::class, 'uploadFlexibleData']);
    Route::get('/flexible/students', [PartnerSchoolController::class, 'getFlexibleStudents']);
    Route::get('/student-population', [PartnerSchoolController::class, 'getStudentPopulation']);
    Route::get('/schools', [PartnerSchoolController::class, 'getSchools']);
    Route::post('/match-headers', [PartnerSchoolController::class, 'matchHeaders']);
});
