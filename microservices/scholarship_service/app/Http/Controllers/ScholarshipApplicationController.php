<?php

namespace App\Http\Controllers;

use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\School;
use App\Models\ScholarshipCategory;
use App\Models\ScholarshipSubcategory;
use App\Models\AcademicRecord;
use App\Models\PartnerSchoolRepresentative;
use App\Models\EnrollmentVerification;
use App\Models\InterviewSchedule;
use App\Models\AcademicPeriod;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\ApplicationStatusHistory;

class ScholarshipApplicationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of applications
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScholarshipApplication::with([
            'student.addresses',
            'student.familyMembers',
            'student.academicRecords',
            'student.currentAcademicRecord',
            'student.financialInformation',
            'category',
            'subcategory',
            'school',
            'documents.documentType'
        ]);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($sq) use ($search) {
                    $sq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('application_number', 'like', "%{$search}%");
            });
        }

        // Default sort
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_dir', 'desc');

        // Map frontend sort keys to database columns
        $sortMapping = [
            'date' => 'created_at',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            'status' => 'status',
            'amount' => 'requested_amount',
        ];

        // Use mapped column or default to created_at if not found
        $dbSortField = $sortMapping[$sortField] ?? 'created_at';

        $query->orderBy($dbSortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $applications = $query->paginate($perPage);

        return response()->json($applications);
    }

    // ... (store, show, update methods remain unchanged)

    /**
     * Submit application for review
     */
    public function submit(Request $request, ScholarshipApplication $application): JsonResponse
    {
        if ($application->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Application can only be submitted from draft status'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $userId = $authUser['id'] ?? null;

            $application->submit();

            // Audit log
            AuditLogService::logAction(
                'SUBMIT',
                "Scholarship application #{$application->application_number} submitted for review",
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'previous_status' => 'draft',
                    'new_status' => 'submitted',
                    'type' => $application->type,
                    'user_id' => $userId
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'submitted',
                'Your application has been successfully submitted and is now under review.'
            );

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve application
     */
    public function approve(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be endorsed to SSC to be approved'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $approvedBy = $authUser['id'] ?? null;
            $application->approve(
                $request->approved_amount,
                $request->notes,
                $approvedBy
            );

            // Audit log
            AuditLogService::logAction(
                'APPROVE',
                "Scholarship application #{$application->application_number} approved with amount: ₱" . number_format($request->approved_amount, 2),
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'approved_amount' => $request->approved_amount,
                    'notes' => $request->notes,
                    'previous_status' => 'endorsed_to_ssc',
                    'new_status' => 'approved',
                    'approved_by' => $approvedBy
                ]
            );

            DB::commit();

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'approved',
                $request->notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Application approved successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject application
     */
    public function reject(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Application cannot be rejected in its current status: ' . $application->status
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewedBy = $authUser['id'] ?? null;
            $application->reject(
                $request->rejection_reason,
                $reviewedBy
            );

            // Audit log
            AuditLogService::logAction(
                'REJECT',
                "Scholarship application #{$application->application_number} rejected",
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'rejection_reason' => $request->rejection_reason,
                    'new_status' => 'rejected',
                    'rejected_by' => $reviewedBy
                ]
            );

            DB::commit();

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'rejected',
                $request->rejection_reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Application rejected',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Review application
     */
    public function review(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeReviewed()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be submitted for documents to be reviewed'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewedBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;
            $application->review(
                $request->notes,
                $reviewedBy
            );

            // ... 

            DB::commit();

            AuditLogService::logAction(
                'REVIEW',
                "Scholarship application #{$application->application_number} reviewed",
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'notes' => $request->notes,
                    'previous_status' => $previousStatus,
                    'new_status' => 'reviewed',
                    'reviewed_by' => $reviewedBy
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'reviewed',
                $request->notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Application reviewed successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to review application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process application for disbursement
     */
    public function process(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeProcessed()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be approved to be processed'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $processedBy = $authUser['id'] ?? null;
            $application->process(
                $request->notes,
                $processedBy
            );

            DB::commit();

            AuditLogService::logAction(
                'PROCESS',
                "Scholarship application #{$application->application_number} processing started",
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'notes' => $request->notes,
                    'previous_status' => 'approved',
                    'new_status' => 'processing',
                    'processed_by' => $processedBy
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'processing',
                $request->notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Grants processing started successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Release funds to student
     */
    public function release(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeReleased()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be in grants processing to disburse funds'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $releasedBy = $authUser['id'] ?? null;
            $application->release(
                $request->notes,
                $releasedBy
            );

            DB::commit();

            // Send notification
            AuditLogService::logAction(
                'RELEASE',
                "Funds released for scholarship application #{$application->application_number}",
                'ScholarshipApplication',
                $application->id,
                null,
                null,
                [
                    'notes' => $request->notes,
                    'previous_status' => 'processing',
                    'new_status' => 'released',
                    'released_by' => $releasedBy
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'released',
                $request->notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Funds released successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to release funds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created application
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'category_id' => 'required|exists:scholarship_categories,id',
            'subcategory_id' => 'required|exists:scholarship_subcategories,id',
            'school_id' => 'required|exists:schools,id',
            'type' => 'required|in:new,renewal',
            'parent_application_id' => 'nullable|string',
            'reason_for_renewal' => 'nullable|string',
            'financial_need_description' => 'required|string',
            'requested_amount' => 'nullable|numeric|min:0',
            'marginalized_groups' => 'nullable|array',
            'digital_wallets' => 'nullable|array',
            'wallet_account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:100',
            'how_did_you_know' => 'nullable|array',
            'is_school_at_caloocan' => 'boolean',

            // Academic record data
            'academic_record' => 'required|array',
            'academic_record.educational_level' => 'required|string',
            'academic_record.program' => 'nullable|string|max:255',
            'academic_record.major' => 'nullable|string|max:255',
            'academic_record.track_specialization' => 'nullable|string|max:255',
            'academic_record.area_of_specialization' => 'nullable|string|max:255',
            'academic_record.year_level' => 'required|string|max:255',
            'academic_record.school_year' => 'required|string|max:255',
            'academic_record.school_term' => 'required|string|max:255',
            'academic_record.units_enrolled' => 'nullable|integer|min:0',
            'academic_record.units_completed' => 'nullable|integer|min:0|max:999',
            'academic_record.gpa' => 'nullable|numeric|min:0|max:4',
            'academic_record.general_weighted_average' => 'nullable|numeric|min:0|max:4',
            'academic_record.previous_school' => 'nullable|string|max:255',
            'academic_record.is_graduating' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Academic Period Validation
        $currentPeriod = AcademicPeriod::current()->open()->first();

        if (!$currentPeriod) {
            return response()->json([
                'success' => false,
                'message' => 'No active and open academic period found.'
            ], 400);
        }

        if (now()->gt($currentPeriod->application_deadline)) {
            return response()->json([
                'success' => false,
                'message' => 'The application deadline for this period has passed.'
            ], 400);
        }



        // Rule: Check if student already has an application for this period
        $existingApplication = ScholarshipApplication::where('student_id', $request->student_id)
            ->where('academic_period_id', $currentPeriod->id)
            ->exists();

        if ($existingApplication) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted an application for this academic period.'
            ], 400);
        }

        // Rule: Renewal Eligibility
        if ($request->type === 'renewal') {
            $latestApplication = ScholarshipApplication::where('student_id', $request->student_id)
                ->where('id', '!=', $request->parent_application_id) // Exclude current if parent mapping (though this is new store)
                ->latest()
                ->first();

            if (!$latestApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'Renewal invalid: No previous scholarship record found.'
                ], 400);
            }

            if ($latestApplication->status === 'rejected' || $latestApplication->status === 'revoked') {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not eligible for renewal due to a previous disqualification or rejection.'
                ], 400);
            }
        }

        try {
            DB::beginTransaction();

            // Generate application number
            $lastApp = ScholarshipApplication::where('application_number', 'like', 'APP-' . date('Y') . '-%')
                ->orderBy('id', 'desc')
                ->first();

            $nextNum = 1;
            if ($lastApp) {
                // Extract number (APP-YYYY-XXXXX)
                $parts = explode('-', $lastApp->application_number);
                if (count($parts) === 3) {
                    $nextNum = intval($parts[2]) + 1;
                }
            }

            $applicationNumber = 'APP-' . date('Y') . '-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

            // Prepare application data
            $applicationData = $request->only([
                'student_id',
                'category_id',
                'subcategory_id',
                'school_id',
                'type',
                'parent_application_id',
                'reason_for_renewal',
                'financial_need_description',
                'requested_amount',
                'marginalized_groups',
                'digital_wallets',
                'wallet_account_number',
                'bank_name',
                'how_did_you_know',
                'is_school_at_caloocan'
            ]);

            $applicationData['academic_period_id'] = $currentPeriod->id;

            // Get subcategory to set the correct requested amount
            $subcategory = ScholarshipSubcategory::find($request->subcategory_id);
            if ($subcategory && $subcategory->amount) {
                // Always use the subcategory amount to ensure consistency
                $applicationData['requested_amount'] = $subcategory->amount;

                Log::info('Setting requested amount from subcategory', [
                    'subcategory_id' => $subcategory->id,
                    'subcategory_name' => $subcategory->name,
                    'amount' => $subcategory->amount,
                    'original_requested_amount' => $request->requested_amount
                ]);
            }

            $applicationData['application_number'] = $applicationNumber;
            $applicationData['status'] = 'draft';

            // Sync legacy fields
            $applicationData['academic_year'] = $currentPeriod->academic_year;
            $applicationData['period_type'] = $currentPeriod->period_type;
            $applicationData['period_number'] = $currentPeriod->period_number;
            $applicationData['submitted_at'] = null;

            $application = ScholarshipApplication::create($applicationData);

            // Create or update academic record
            if ($request->has('academic_record')) {
                try {
                    $academicData = $request->academic_record;
                    $academicData['student_id'] = $request->student_id;
                    $academicData['school_id'] = $request->school_id;
                    $academicData['is_current'] = true;

                    Log::info('Creating academic record', [
                        'academic_data' => $academicData,
                        'student_id' => $request->student_id
                    ]);

                    // Mark previous records as not current
                    AcademicRecord::where('student_id', $request->student_id)
                        ->where('is_current', true)
                        ->update(['is_current' => false]);

                    $academicRecord = AcademicRecord::create($academicData);
                    Log::info('Academic record created successfully', [
                        'academic_record_id' => $academicRecord->id
                    ]);
                } catch (\Exception $academicError) {
                    Log::error('Failed to create academic record', [
                        'error' => $academicError->getMessage(),
                        'trace' => $academicError->getTraceAsString(),
                        'academic_data' => $request->academic_record ?? 'not provided'
                    ]);
                    throw $academicError;
                }
            }

            DB::commit();

            // Try to eager-load relations, but don't fail the request if it errors
            try {
                $application->load([
                    'student',
                    'category',
                    'subcategory',
                    'school'
                ]);
            } catch (\Throwable $loadError) {
                // Log the load error but continue returning success
                Log::warning('Application load failed after create', [
                    'application_id' => $application->id,
                    'error' => $loadError->getMessage(),
                ]);
            }

            // Audit log
            $authUser = $request->get('auth_user');
            $userId = $authUser['id'] ?? null;
            AuditLogService::logAction(
                'CREATE',
                "Scholarship application #{$application->application_number} created",
                'ScholarshipApplication',
                $application->id,
                null,
                $application->toArray(),
                [
                    'type' => $application->type,
                    'category_id' => $application->category_id,
                    'subcategory_id' => $application->subcategory_id,
                    'student_id' => $application->student_id,
                    'school_id' => $application->school_id,
                    'requested_amount' => $application->requested_amount,
                    'created_by' => $userId
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application created successfully',
                'data' => $application
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create application', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified application
     */
    public function show(ScholarshipApplication $application): JsonResponse
    {
        $application->load([
            'student.addresses',
            'student.familyMembers',
            'student.financialInformation',
            'student.emergencyContacts',
            'student.currentAcademicRecord.school',
            'category',
            'subcategory',
            'school',
            'documents.documentType',
            'statusHistory.changedBy'
        ]);

        return response()->json([
            'success' => true,
            'data' => $application
        ]);
    }

    /**
     * Update the specified application
     */
    public function update(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason_for_renewal' => 'nullable|string',
            'financial_need_description' => 'sometimes|required|string',
            'requested_amount' => 'nullable|numeric|min:0',
            'marginalized_groups' => 'nullable|array',
            'digital_wallets' => 'nullable|array',
            'wallet_account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:100',
            'how_did_you_know' => 'nullable|array',
            'is_school_at_caloocan' => 'boolean',
            'notes' => 'nullable|string',

            // Academic record validation
            'academic_record' => 'nullable|array',
            'academic_record.educational_level' => 'required_with:academic_record|string',
            'academic_record.program' => 'nullable|string|max:255',
            'academic_record.major' => 'nullable|string|max:255',
            'academic_record.track_specialization' => 'nullable|string|max:255',
            'academic_record.area_of_specialization' => 'nullable|string|max:255',
            'academic_record.year_level' => 'required_with:academic_record|string|max:255',
            'academic_record.school_year' => 'required_with:academic_record|string|max:255',
            'academic_record.school_term' => 'required_with:academic_record|string|max:255',
            'academic_record.units_enrolled' => 'nullable|integer|min:0',
            'academic_record.units_completed' => 'nullable|integer|min:0|max:999',
            'academic_record.gpa' => 'nullable|numeric|min:0|max:4',
            'academic_record.general_weighted_average' => 'nullable|numeric|min:0|max:4',
            'academic_record.previous_school' => 'nullable|string|max:255',
            'academic_record.previous_school_address' => 'nullable|string|max:255',
            'academic_record.is_graduating' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only([
                'reason_for_renewal',
                'financial_need_description',
                'requested_amount',
                'marginalized_groups',
                'digital_wallets',
                'wallet_account_number',
                'bank_name',
                'how_did_you_know',
                'is_school_at_qc',
                'notes'
            ]);

            // Ensure requested amount matches subcategory amount
            if ($application->subcategory && $application->subcategory->amount) {
                $updateData['requested_amount'] = $application->subcategory->amount;

                Log::info('Updating requested amount to match subcategory', [
                    'application_id' => $application->id,
                    'subcategory_id' => $application->subcategory->id,
                    'subcategory_name' => $application->subcategory->name,
                    'amount' => $application->subcategory->amount,
                    'original_requested_amount' => $request->requested_amount
                ]);
            }

            $application->update($updateData);

            // Update academic record if provided
            if ($request->has('academic_record')) {
                try {
                    $academicData = $request->academic_record;
                    $academicData['student_id'] = $application->student_id;
                    $academicData['school_id'] = $application->school_id;
                    $academicData['is_current'] = true;

                    Log::info('Updating academic record', [
                        'academic_data' => $academicData,
                        'student_id' => $application->student_id
                    ]);

                    // Find the current academic record for this student
                    $academicRecord = AcademicRecord::where('student_id', $application->student_id)
                        ->where('is_current', true)
                        ->first();

                    if ($academicRecord) {
                        $academicRecord->update($academicData);
                        Log::info('Academic record updated successfully', [
                            'academic_record_id' => $academicRecord->id
                        ]);
                    } else {
                        // Create new academic record if none exists
                        $academicRecord = AcademicRecord::create($academicData);
                        Log::info('Academic record created successfully', [
                            'academic_record_id' => $academicRecord->id
                        ]);
                    }
                } catch (\Exception $academicError) {
                    Log::error('Failed to update academic record', [
                        'error' => $academicError->getMessage(),
                        'student_id' => $application->student_id
                    ]);
                }
            }

            $application->load(['student', 'category', 'subcategory', 'school']);

            // Audit log
            $authUser = $request->get('auth_user');
            $userId = $authUser['id'] ?? null;
            AuditLogService::logAction(
                'UPDATE',
                "Scholarship application #{$application->application_number} updated",
                'ScholarshipApplication',
                $application->id,
                null,
                $updateData,
                [
                    'updated_fields' => array_keys($updateData),
                    'academic_record_updated' => $request->has('academic_record'),
                    'updated_by' => $userId
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application updated successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update application',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Remove the specified application
     */
    public function destroy(ScholarshipApplication $application): JsonResponse
    {
        if (!$application->canBeDeleted()) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft applications can be deleted'
            ], 400);
        }

        try {
            $authUser = request()->get('auth_user');
            $userId = $authUser['id'] ?? null;
            $appNumber = $application->application_number;
            $appId = $application->id;

            // Audit log before deletion
            AuditLogService::logAction(
                'scholarship_application',
                $appId,
                'deleted',
                "Scholarship application #{$appNumber} deleted",
                $userId,
                [
                    'status' => $application->status,
                    'student_id' => $application->student_id,
                    'type' => $application->type
                ]
            );

            $application->delete();

            return response()->json([
                'success' => true,
                'message' => 'Application deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function flagForCompliance(Request $request, $id)
    {
        try {
            $application = ScholarshipApplication::findOrFail($id);

            $request->validate([
                'reason' => 'required|string|max:1000'
            ]);

            if (!$application->canBeReviewed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application must be submitted for documents to be flagged for compliance'
                ], 400);
            }

            try {
                DB::beginTransaction();

                $authUser = $request->get('auth_user');
                $flaggedBy = $authUser['id'] ?? null;

                $application->flagForCompliance(
                    $request->reason,
                    $flaggedBy
                );

                // Audit log
                AuditLogService::logAction(
                    'scholarship_application',
                    $application->id,
                    'flagged_for_compliance',
                    "Scholarship application #{$application->application_number} flagged for compliance",
                    $flaggedBy,
                    [
                        'reason' => $request->reason,
                        'previous_status' => $application->getOriginal('status'),
                        'new_status' => 'for_compliance'
                    ]
                );

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Application flagged for compliance successfully',
                    'data' => $application
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to flag application for compliance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve application for enrollment verification
     * Status: documents_reviewed → approved_pending_verification
     */
    public function approveForVerification(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canBeApprovedForVerification()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be in documents_reviewed status to approve for verification'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $approvedBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            $application->approveForVerification($approvedBy, $request->notes);

            DB::commit();

            AuditLogService::logAction(
                'APPLICATION_APPROVED_FOR_VERIFICATION',
                'Application approved for enrollment verification',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                ['status' => $application->status, 'notes' => $request->notes],
                [
                    'application_number' => $application->application_number,
                    'approved_by' => $approvedBy,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application approved for enrollment verification',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve application for verification', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application for verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit enrollment verification
     * Status: approved_pending_verification → enrollment_verified
     */
    public function verifyEnrollment(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'enrollment_proof_document_id' => 'required|exists:documents,id',
            'enrollment_year' => 'required|string|max:255',
            'enrollment_term' => 'required|string|max:255',
            'is_currently_enrolled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'approved_pending_verification') {
            return response()->json([
                'success' => false,
                'message' => 'Application must be approved for verification first'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $verifiedBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            // Create enrollment verification
            $verification = EnrollmentVerification::createForApplication($application);
            $verification->update([
                'enrollment_proof_document_id' => $request->enrollment_proof_document_id,
                'enrollment_year' => $request->enrollment_year,
                'enrollment_term' => $request->enrollment_term,
                'is_currently_enrolled' => $request->is_currently_enrolled,
                'verification_status' => 'verified',
                'verified_by' => $verifiedBy,
                'verified_at' => now(),
            ]);

            // Update application status
            $application->confirmEnrollment($verification->id, $verifiedBy);

            DB::commit();

            AuditLogService::logAction(
                'ENROLLMENT_VERIFIED',
                'Enrollment verification completed',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                ['status' => $application->status],
                [
                    'verification_id' => $verification->id,
                    'verified_by' => $verifiedBy,
                    'enrollment_year' => $request->enrollment_year,
                    'enrollment_term' => $request->enrollment_term,
                    'is_currently_enrolled' => $request->is_currently_enrolled,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Enrollment verification completed',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to verify enrollment', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify enrollment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Schedule interview manually
     * Status: enrollment_verified → interview_scheduled
     */
    public function scheduleInterview(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'interview_date' => 'required|date|after_or_equal:today',
            'interview_time' => 'required|date_format:H:i',
            'interview_location' => 'nullable|string|max:255',
            'interview_type' => 'required|in:in_person,online,phone',
            'meeting_link' => 'nullable|string|max:500',
            'interviewer_id' => 'nullable|integer',
            'staff_id' => 'nullable|integer',
            'interviewer_name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canProceedToInterview()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be enrollment verified to schedule interview'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $scheduledBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            // Check for interviewer conflicts
            if ($request->staff_id) {
                $conflicts = $this->checkInterviewerConflicts(
                    $request->staff_id,
                    $request->interview_date,
                    $request->interview_time,
                    $request->duration ?? 30 // Default 30 minutes if not specified
                );

                if (!empty($conflicts)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Interviewer has conflicting schedule',
                        'conflicts' => $conflicts
                    ], 409); // 409 Conflict status code
                }
            }

            $interviewData = $request->only([
                'interview_date',
                'interview_time',
                'interview_location',
                'interview_type',
                'meeting_link',
                'interviewer_id',
                'staff_id',
                'interviewer_name',
                'notes'
            ]);
            $interviewData['scheduling_type'] = 'manual';
            $interviewData['scheduled_by'] = $scheduledBy;
            $interviewData['interview_notes'] = $interviewData['notes'] ?? null;
            $interviewData['duration'] = $request->duration ?? 30; // Add duration to interview data
            unset($interviewData['notes']);

            $application->scheduleInterviewManually($interviewData, $scheduledBy);

            DB::commit();

            AuditLogService::logAction(
                'INTERVIEW_SCHEDULED_MANUAL',
                'Interview scheduled manually',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                ['status' => $application->status],
                [
                    'application_number' => $application->application_number,
                    'scheduled_by' => $scheduledBy,
                    'interview_date' => $interviewData['interview_date'],
                    'interview_time' => $interviewData['interview_time'],
                    'interview_type' => $interviewData['interview_type'],
                    'duration' => $interviewData['duration'],
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification($application, 'interview_scheduled', null, [
                'interview_date' => $interviewData['interview_date'],
                'interview_time' => $interviewData['interview_time'],
                'interview_type' => $interviewData['interview_type'],
                'meeting_link' => $interviewData['meeting_link'] ?? null,
                'interviewer_name' => $interviewData['interviewer_name'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Interview scheduled successfully',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to schedule interview', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Schedule interview automatically
     * Status: enrollment_verified → interview_scheduled
     */
    public function scheduleInterviewAuto(Request $request, ScholarshipApplication $application): JsonResponse
    {
        if (!$application->canProceedToInterview()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must be enrollment verified to schedule interview'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $scheduledBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            // Get available slots for next 7 days
            $availableSlots = $this->getAvailableSlots(7);

            if (empty($availableSlots)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No available interview slots found'
                ], 400);
            }

            // Select first available slot
            $slot = $availableSlots[0];

            $interviewData = [
                'interview_date' => $slot['date'],
                'interview_time' => $slot['time'],
                'interview_location' => $slot['location'] ?? 'TBD',
                'interview_type' => $slot['type'] ?? 'in_person',
                'meeting_link' => $slot['meeting_link'] ?? null,
                'interviewer_id' => $slot['interviewer_id'] ?? null,
                'interviewer_name' => $slot['interviewer_name'] ?? 'TBD',
                'scheduling_type' => 'automatic',
                'scheduled_by' => $scheduledBy,
            ];

            $application->scheduleInterviewAutomatically($interviewData);

            DB::commit();

            AuditLogService::logAction(
                'INTERVIEW_SCHEDULED_AUTO',
                'Interview scheduled automatically',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                ['status' => $application->status],
                [
                    'application_number' => $application->application_number,
                    'scheduled_by' => $scheduledBy,
                    'interview_date' => $interviewData['interview_date'],
                    'interview_time' => $interviewData['interview_time'],
                    'interview_type' => $interviewData['interview_type'],
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Interview scheduled automatically',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to auto-schedule interview', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to auto-schedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete interview
     * Status: interview_scheduled → interview_completed
     */
    public function completeInterview(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'interview_result' => 'required|in:passed,failed,needs_followup',
            'interview_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$application->canCompleteInterview()) {
            return response()->json([
                'success' => false,
                'message' => 'Application must have a scheduled interview to complete'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $completedBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            $application->completeInterview(
                $request->interview_result,
                $request->interview_notes,
                $completedBy
            );

            DB::commit();

            AuditLogService::logAction(
                'INTERVIEW_COMPLETED',
                'Interview completed',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                [
                    'status' => $application->status,
                    'interview_result' => $request->interview_result,
                ],
                [
                    'application_number' => $application->application_number,
                    'completed_by' => $completedBy,
                    'interview_notes' => $request->interview_notes,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Interview completed successfully',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete interview', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endorse application to SSC
     * Status: interview_completed → endorsed_to_ssc
     */
    public function endorseToSSC(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'interview_completed') {
            return response()->json([
                'success' => false,
                'message' => 'Application must have completed interview to be endorsed to SSC'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $endorsedBy = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            $application->endorseToSSC($request->notes, $endorsedBy);

            DB::commit();

            AuditLogService::logAction(
                'SSC_ENDORSE',
                'Application endorsed to SSC',
                'ScholarshipApplication',
                (string) $application->id,
                ['status' => $previousStatus],
                ['status' => $application->status],
                [
                    'application_number' => $application->application_number,
                    'endorsed_by' => $endorsedBy,
                    'notes' => $request->notes,
                ]
            );

            // Send notification
            $this->notificationService->sendApplicationStatusNotification(
                $application,
                'endorsed_to_ssc',
                'Your application has been endorsed to the Scholarship Selection Committee (SSC) for final approval.'
            );

            return response()->json([
                'success' => true,
                'message' => 'Application successfully endorsed to SSC',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to endorse application to SSC', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to endorse application to SSC',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk endorse applications to SSC
     * Status: interview_completed → endorsed_to_ssc
     */
    public function bulkEndorseToSSC(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'integer|exists:scholarship_applications,id',
            'filter_type' => 'required|in:recommended,conditional,all',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $endorsedBy = $authUser['id'] ?? null;
            $applicationIds = $request->application_ids;
            $filterType = $request->filter_type;
            $notes = $request->notes ?? 'Bulk endorsed to SSC';

            // Get applications that are ready for endorsement
            $query = ScholarshipApplication::whereIn('id', $applicationIds)
                ->where('status', 'interview_completed')
                ->with(['interviewSchedule.evaluation']);

            // Apply filter based on interview evaluation results
            if ($filterType === 'recommended') {
                $query->whereHas('interviewSchedule.evaluation', function ($q) {
                    $q->where('overall_recommendation', 'recommended');
                });
            } elseif ($filterType === 'conditional') {
                $query->whereHas('interviewSchedule.evaluation', function ($q) {
                    $q->where('overall_recommendation', 'needs_followup');
                });
            }
            // 'all' doesn't add any additional filtering

            $applications = $query->get();

            if ($applications->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No applications found matching the criteria for bulk endorsement'
                ], 400);
            }

            $endorsedCount = 0;
            $failedApplications = [];

            foreach ($applications as $application) {
                try {
                    $previousStatus = $application->status;
                    $application->endorseToSSC($notes, $endorsedBy);
                    $endorsedCount++;

                    AuditLogService::logAction(
                        'SSC_ENDORSE',
                        'Application endorsed to SSC (bulk)',
                        'ScholarshipApplication',
                        (string) $application->id,
                        ['status' => $previousStatus],
                        ['status' => $application->status],
                        [
                            'application_number' => $application->application_number,
                            'endorsed_by' => $endorsedBy,
                            'notes' => $notes,
                            'bulk_operation' => true,
                            'filter_type' => $filterType,
                        ]
                    );

                    // Send notification
                    $this->notificationService->sendApplicationStatusNotification(
                        $application,
                        'endorsed_to_ssc',
                        'Your application has been endorsed to the Scholarship Selection Committee (SSC) for final approval.'
                    );

                } catch (\Exception $e) {
                    $failedApplications[] = [
                        'id' => $application->id,
                        'application_number' => $application->application_number,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully endorsed {$endorsedCount} application(s) to SSC",
                'data' => [
                    'endorsed_count' => $endorsedCount,
                    'total_processed' => $applications->count(),
                    'failed_applications' => $failedApplications,
                    'filter_type' => $filterType
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk endorse applications to SSC', [
                'exception' => $e->getMessage(),
                'application_ids' => $request->application_ids,
                'filter_type' => $request->filter_type,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk endorse applications to SSC',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available interview slots for auto-scheduling
     */
    private function getAvailableSlots($days = 7): array
    {
        $slots = [];
        $startDate = now();
        $endDate = now()->addDays($days);

        // Define business hours (9 AM to 5 PM, 30-minute intervals)
        $timeSlots = [];
        for ($hour = 9; $hour < 17; $hour++) {
            for ($minute = 0; $minute < 60; $minute += 30) {
                $timeSlots[] = sprintf('%02d:%02d', $hour, $minute);
            }
        }

        // Get booked slots
        $bookedSlots = InterviewSchedule::whereBetween('interview_date', [$startDate, $endDate])
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->get()
            ->groupBy(function ($schedule) {
                return $schedule->interview_date . ' ' . $schedule->interview_time;
            });

        // Generate available slots
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if ($date->isWeekend())
                continue; // Skip weekends

            foreach ($timeSlots as $time) {
                $slotKey = $date->format('Y-m-d') . ' ' . $time;

                if (!isset($bookedSlots[$slotKey])) {
                    $slots[] = [
                        'date' => $date->format('Y-m-d'),
                        'time' => $time,
                        'location' => 'Main Office',
                        'type' => 'in_person',
                        'interviewer_id' => null,
                        'interviewer_name' => 'Available',
                    ];
                }
            }
        }

        return $slots;
    }

    /**
     * Check for interviewer conflicts
     */
    private function checkInterviewerConflicts($staffId, $date, $time, $duration, $excludeScheduleId = null): array
    {
        if (!$staffId) {
            return []; // No conflicts if no staff assigned
        }

        $startTime = Carbon::parse($date . ' ' . $time);
        $endTime = $startTime->copy()->addMinutes($duration);

        $query = InterviewSchedule::where('staff_id', $staffId)
            ->where('interview_date', $date)
            ->whereIn('status', ['scheduled', 'rescheduled']);

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        $existingSchedules = $query->get();
        $conflicts = [];

        foreach ($existingSchedules as $schedule) {
            $existingStartTime = Carbon::createFromFormat('Y-m-d H:i:s', $schedule->interview_date->format('Y-m-d') . ' ' . $schedule->interview_time);
            $existingDuration = $schedule->duration ?? 30; // Default 30 minutes
            $existingEndTime = $existingStartTime->copy()->addMinutes($existingDuration);

            // Check if time ranges overlap
            if ($this->timeRangesOverlap($startTime, $endTime, $existingStartTime, $existingEndTime)) {
                $conflicts[] = [
                    'schedule_id' => $schedule->id,
                    'student_name' => $schedule->application->student->first_name . ' ' . $schedule->application->student->last_name,
                    'start_time' => $existingStartTime->format('H:i'),
                    'end_time' => $existingEndTime->format('H:i'),
                    'display_start_time' => $existingStartTime->format('g:i A'),
                    'display_end_time' => $existingEndTime->format('g:i A'),
                    'interview_type' => $schedule->interview_type,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Check if two time ranges overlap
     */
    private function timeRangesOverlap($start1, $end1, $start2, $end2): bool
    {
        return $start1->lt($end2) && $end1->gt($start2);
    }

    /**
     * Get applications ready for SSC endorsement (completed interviews)
     */
    public function getSscPendingApplications(Request $request): JsonResponse
    {
        try {
            $query = ScholarshipApplication::with([
                'student.addresses',
                'student.academicRecords',
                'student.currentAcademicRecord',
                'category',
                'subcategory',
                'school',
                'documents.documentType',
                'interviewSchedule.evaluation',
                'latestSscDecision'
            ])->where('status', 'interview_completed');

            // Apply filters
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('school_id')) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('student_id_number', 'like', "%{$search}%");
                });
            }

            if ($request->has('date_from')) {
                $query->where('updated_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('updated_at', '<=', $request->date_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'updated_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 50);
            $applications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC pending applications', [
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC pending applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SSC approve application
     */
    public function sscApprove(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved_amount' => 'required|numeric|min:0|max:' . ($application->requested_amount ?? 999999),
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'endorsed_to_ssc') {
            return response()->json([
                'success' => false,
                'message' => 'Application must be in endorsed_to_ssc status to be approved by SSC'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $approvedBy = $authUser['id'] ?? null;

            // Update application status
            $application->update([
                'status' => 'approved',
                'approved_amount' => $request->approved_amount,
                'approved_at' => now(),
                'approved_by' => $approvedBy,
                'notes' => $request->notes,
            ]);

            // Create SSC decision record
            $application->sscDecisions()->create([
                'decision' => 'approved',
                'approved_amount' => $request->approved_amount,
                'notes' => $request->notes,
                'decided_by' => $approvedBy,
                'decided_at' => now()
            ]);

            // Add to status history
            $application->statusHistory()->create([
                'status' => 'approved',
                'notes' => 'Application approved by SSC. ' . ($request->notes ?? ''),
                'changed_by' => $approvedBy,
                'changed_at' => now(),
            ]);

            // Audit log
            AuditLogService::logAction(
                'scholarship_application',
                $application->id,
                'ssc_approved',
                "Scholarship application #{$application->application_number} approved by SSC with amount: ₱" . number_format($request->approved_amount, 2),
                $approvedBy,
                [
                    'approved_amount' => $request->approved_amount,
                    'notes' => $request->notes,
                    'previous_status' => 'endorsed_to_ssc',
                    'new_status' => 'approved'
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Application approved successfully',
                'data' => $application->fresh([
                    'student',
                    'category',
                    'subcategory',
                    'school',
                    'latestSscDecision'
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve application by SSC', [
                'application_id' => $application->id,
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SSC reject application
     */
    public function sscReject(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'endorsed_to_ssc') {
            return response()->json([
                'success' => false,
                'message' => 'Application must be in endorsed_to_ssc status to be rejected by SSC'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewedBy = $authUser['id'] ?? null;

            // Update application status
            $application->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'reviewed_at' => now(),
                'reviewed_by' => $reviewedBy,
            ]);

            // Create SSC decision record
            $application->sscDecisions()->create([
                'decision' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'decided_by' => $reviewedBy,
                'decided_at' => now()
            ]);

            // Add to status history
            $application->statusHistory()->create([
                'status' => 'rejected',
                'notes' => 'Application rejected by SSC. Reason: ' . $request->rejection_reason,
                'changed_by' => $reviewedBy,
                'changed_at' => now(),
            ]);

            // Audit log
            AuditLogService::logAction(
                'scholarship_application',
                $application->id,
                'ssc_rejected',
                "Scholarship application #{$application->application_number} rejected by SSC",
                $reviewedBy,
                [
                    'rejection_reason' => $request->rejection_reason,
                    'previous_status' => 'endorsed_to_ssc',
                    'new_status' => 'rejected'
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Application rejected successfully',
                'data' => $application->fresh([
                    'student',
                    'category',
                    'subcategory',
                    'school',
                    'latestSscDecision'
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reject application by SSC', [
                'application_id' => $application->id,
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SSC bulk approve applications
     */
    public function sscBulkApprove(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'integer|exists:scholarship_applications,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $approvedBy = $authUser['id'] ?? null;
            $applicationIds = $request->application_ids;
            $notes = $request->notes ?? 'Bulk approved by SSC';

            // Get applications that are endorsed to SSC
            $applications = ScholarshipApplication::whereIn('id', $applicationIds)
                ->where('status', 'endorsed_to_ssc')
                ->get();

            if ($applications->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No applications found in endorsed_to_ssc status'
                ], 400);
            }

            $approvedCount = 0;
            $failedApplications = [];

            foreach ($applications as $application) {
                try {
                    $previousStatus = $application->status;

                    // Update application status
                    $application->update([
                        'status' => 'approved',
                        'approved_amount' => $application->requested_amount,
                        'approved_at' => now(),
                        'approved_by' => $approvedBy,
                        'notes' => $notes,
                    ]);

                    // Create SSC decision record
                    $application->sscDecisions()->create([
                        'decision' => 'approved',
                        'approved_amount' => $application->requested_amount,
                        'notes' => $notes,
                        'decided_by' => $approvedBy,
                        'decided_at' => now()
                    ]);

                    // Add to status history
                    $application->statusHistory()->create([
                        'status' => 'approved',
                        'notes' => 'Application approved by SSC (bulk operation). ' . $notes,
                        'changed_by' => $approvedBy,
                        'changed_at' => now(),
                    ]);

                    AuditLogService::logAction(
                        'SSC_APPROVE',
                        'Application approved by SSC (bulk)',
                        'ScholarshipApplication',
                        (string) $application->id,
                        ['status' => $previousStatus],
                        [
                            'status' => $application->status,
                            'approved_amount' => $application->approved_amount,
                        ],
                        [
                            'application_number' => $application->application_number,
                            'approved_by' => $approvedBy,
                            'notes' => $notes,
                            'bulk_operation' => true,
                        ]
                    );

                    $approvedCount++;
                } catch (\Exception $e) {
                    $failedApplications[] = [
                        'id' => $application->id,
                        'application_number' => $application->application_number,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully approved {$approvedCount} application(s)",
                'data' => [
                    'approved_count' => $approvedCount,
                    'total_processed' => $applications->count(),
                    'failed_applications' => $failedApplications
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk approve applications by SSC', [
                'exception' => $e->getMessage(),
                'application_ids' => $request->application_ids
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk approve applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SSC bulk reject applications
     */
    public function sscBulkReject(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'integer|exists:scholarship_applications,id',
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewedBy = $authUser['id'] ?? null;
            $applicationIds = $request->application_ids;
            $rejectionReason = $request->rejection_reason;

            // Get applications that are endorsed to SSC
            $applications = ScholarshipApplication::whereIn('id', $applicationIds)
                ->where('status', 'endorsed_to_ssc')
                ->get();

            if ($applications->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No applications found in endorsed_to_ssc status'
                ], 400);
            }

            $rejectedCount = 0;
            $failedApplications = [];

            foreach ($applications as $application) {
                try {
                    $previousStatus = $application->status;

                    // Update application status
                    $application->update([
                        'status' => 'rejected',
                        'rejection_reason' => $rejectionReason,
                        'reviewed_at' => now(),
                        'reviewed_by' => $reviewedBy,
                    ]);

                    // Create SSC decision record
                    $application->sscDecisions()->create([
                        'decision' => 'rejected',
                        'rejection_reason' => $rejectionReason,
                        'decided_by' => $reviewedBy,
                        'decided_at' => now()
                    ]);

                    // Add to status history
                    $application->statusHistory()->create([
                        'status' => 'rejected',
                        'notes' => 'Application rejected by SSC (bulk operation). Reason: ' . $rejectionReason,
                        'changed_by' => $reviewedBy,
                        'changed_at' => now(),
                    ]);

                    AuditLogService::logAction(
                        'SSC_REJECT',
                        'Application rejected by SSC (bulk)',
                        'ScholarshipApplication',
                        (string) $application->id,
                        ['status' => $previousStatus],
                        [
                            'status' => $application->status,
                            'rejection_reason' => $rejectionReason,
                        ],
                        [
                            'application_number' => $application->application_number,
                            'rejected_by' => $reviewedBy,
                            'bulk_operation' => true,
                        ]
                    );

                    $rejectedCount++;
                } catch (\Exception $e) {
                    $failedApplications[] = [
                        'id' => $application->id,
                        'application_number' => $application->application_number,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully rejected {$rejectedCount} application(s)",
                'data' => [
                    'rejected_count' => $rejectedCount,
                    'total_processed' => $applications->count(),
                    'failed_applications' => $failedApplications
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk reject applications by SSC', [
                'exception' => $e->getMessage(),
                'application_ids' => $request->application_ids
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk reject applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get SSC statistics
     */
    public function getSscStatistics(Request $request): JsonResponse
    {
        try {
            $totalApplications = ScholarshipApplication::count();
            $pendingReview = ScholarshipApplication::where('status', 'endorsed_to_ssc')->count();
            $approved = ScholarshipApplication::where('status', 'approved')->count();
            $rejected = ScholarshipApplication::where('status', 'rejected')->count();

            // Get decisions this month
            $thisMonth = now()->startOfMonth();
            $thisMonthDecisions = \App\Models\SscDecision::where('decided_at', '>=', $thisMonth)->count();

            // Get average processing time (days from endorsed_to_ssc to decision)
            $avgProcessingTime = \App\Models\SscDecision::selectRaw('AVG(DATEDIFF(decided_at, created_at)) as avg_days')
                ->whereNotNull('decided_at')
                ->value('avg_days');

            return response()->json([
                'success' => true,
                'data' => [
                    'totalApplications' => $totalApplications,
                    'pendingReview' => $pendingReview,
                    'approved' => $approved,
                    'rejected' => $rejected,
                    'thisMonthDecisions' => $thisMonthDecisions,
                    'averageProcessingTime' => round($avgProcessingTime ?? 0, 1)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC statistics', [
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get SSC decision history
     */
    public function getSscDecisionHistory(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\SscDecision::with([
                'application.student',
                'application.category',
                'application.subcategory',
                'application.school'
            ]);

            // Apply filters
            if ($request->has('decision')) {
                $query->where('decision', $request->decision);
            }

            if ($request->has('date_from')) {
                $query->where('decided_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('decided_at', '<=', $request->date_to);
            }

            if ($request->has('decided_by')) {
                $query->where('decided_by', $request->decided_by);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'decided_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 50);
            $decisions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $decisions
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC decision history', [
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC decision history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all SSC review decisions from all stages
     */
    public function getAllSscDecisions(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\SscReview::with([
                'application.student',
                'application.category',
                'application.subcategory',
                'application.school'
            ]);

            // Apply filters
            if ($request->has('stage')) {
                $query->where('review_stage', $request->stage);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from')) {
                $query->where(function ($q) use ($request) {
                    $q->where('approved_at', '>=', $request->date_from)
                        ->orWhere('reviewed_at', '>=', $request->date_from)
                        ->orWhere('created_at', '>=', $request->date_from);
                });
            }

            if ($request->has('date_to')) {
                $query->where(function ($q) use ($request) {
                    $q->where('approved_at', '<=', $request->date_to)
                        ->orWhere('reviewed_at', '<=', $request->date_to)
                        ->orWhere('created_at', '<=', $request->date_to);
                });
            }

            if ($request->has('reviewed_by')) {
                $query->where('reviewer_id', $request->reviewed_by);
            }

            // Only show approved/rejected reviews (not pending)
            $query->whereIn('status', ['approved', 'rejected']);

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 50);
            $decisions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $decisions
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch all SSC decisions', [
                'exception' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch all SSC decisions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ===== NEW SSC MULTI-STAGE METHODS =====

    /**
     * Get applications by current SSC stage
     */
    public function getSscApplicationsByStage(Request $request, $stage): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            $userId = $authUser['id'] ?? null;

            // Validate stage
            $validStages = ['document_verification', 'financial_review', 'academic_review', 'final_approval'];
            if (!in_array($stage, $validStages)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid stage provided'
                ], 400);
            }

            // Use parallel workflow - get applications for this stage
            $query = ScholarshipApplication::getApplicationsForStage($stage)
                ->with([
                    'student.addresses',
                    'student.academicRecords',
                    'student.currentAcademicRecord',
                    'student.financialInformation',
                    'category',
                    'subcategory',
                    'school',
                    'documents.documentType',
                    'interviewSchedule.evaluation',
                    'sscReviews' => function ($q) {
                        $q->orderBy('created_at', 'desc');
                    },
                    'latestSscDecision'
                ]);

            // Role-based filtering - only show applications user can review
            if ($userId) {
                $userRoles = \App\Models\SscMemberAssignment::getUserRoles($userId)
                    ->pluck('ssc_role')->toArray();

                $allowedRoles = \App\Models\SscMemberAssignment::STAGE_ROLE_MAPPING[$stage] ?? [];

                // If user doesn't have appropriate role, return empty results
                if (!array_intersect($userRoles, $allowedRoles)) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'current_page' => 1,
                            'data' => [],
                            'total' => 0,
                            'per_page' => 15,
                        ]
                    ]);
                }
            }

            // Apply filters
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('school_id')) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('student_id_number', 'like', "%{$search}%");
                });
            }

            if ($request->has('date_from')) {
                $query->where('updated_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('updated_at', '<=', $request->date_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'updated_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $applications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC applications by stage', [
                'exception' => $e->getMessage(),
                'stage' => $stage,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my assigned applications (role-based)
     */
    public function getMySscApplications(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            $userId = $authUser['id'] ?? null;

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get user's assigned roles and stages
            $userAssignments = \App\Models\SscMemberAssignment::getUserRoles($userId);

            if ($userAssignments->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'current_page' => 1,
                        'data' => [],
                        'total' => 0,
                        'per_page' => 15,
                    ]
                ]);
            }

            // Get stages user can review
            $userStages = $userAssignments->pluck('review_stage')->unique()->toArray();

            // Map stages to statuses
            $stageStatusMapping = [
                'document_verification' => 'ssc_document_verification',
                'financial_review' => 'ssc_financial_review',
                'academic_review' => 'ssc_academic_review',
                'final_approval' => 'ssc_final_approval',
            ];

            $statuses = array_intersect_key($stageStatusMapping, array_flip($userStages));

            $query = ScholarshipApplication::with([
                'student.addresses',
                'student.academicRecords',
                'student.currentAcademicRecord',
                'category',
                'subcategory',
                'school',
                'documents.documentType',
                'interviewSchedule.evaluation',
                'sscReviews' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
                'latestSscDecision'
            ])->whereIn('status', $statuses);

            // Apply filters (same as above)
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('school_id')) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('student_id_number', 'like', "%{$search}%");
                });
            }

            if ($request->has('date_from')) {
                $query->where('updated_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('updated_at', '<=', $request->date_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'updated_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $applications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch my SSC applications', [
                'exception' => $e->getMessage(),
                'user_id' => $userId ?? 'unknown',
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch my SSC applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit document verification review
     */
    public function sscSubmitDocumentVerification(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'verified' => 'required|boolean',
            'notes' => 'nullable|string|max:1000',
            'document_issues' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For parallel workflow, allow applications in endorsed_to_ssc or ssc_final_approval status
        if (!in_array($application->status, ['endorsed_to_ssc', 'ssc_final_approval'])) {
            return response()->json([
                'success' => false,
                'message' => 'Application is not in SSC review stage'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;
            $previousStatus = $application->status;
            $previousStageStatus = $application->ssc_stage_status ?? null;

            if ($request->verified) {
                // Use parallel workflow - approve the document verification stage
                $success = $application->approveStage(
                    'document_verification',
                    $reviewerId,
                    $request->notes,
                    [
                        'document_issues' => $request->document_issues ?? [],
                        'verified_at' => now(),
                    ]
                );

                if ($success) {
                    AuditLogService::logAction(
                        'SSC_DOCUMENT_VERIFICATION_APPROVED',
                        'Document verification stage approved',
                        'ScholarshipApplication',
                        (string) $application->id,
                        [
                            'status' => $previousStatus,
                            'ssc_stage_status' => $previousStageStatus,
                        ],
                        [
                            'status' => $application->status,
                            'ssc_stage_status' => $application->ssc_stage_status,
                        ],
                        [
                            'application_number' => $application->application_number,
                            'review_stage' => 'document_verification',
                            'reviewed_by' => $reviewerId,
                            'notes' => $request->notes,
                            'document_issues' => $request->document_issues ?? [],
                            'verified' => true,
                        ]
                    );

                    return response()->json([
                        'success' => true,
                        'message' => 'Document verification stage approved successfully.',
                        'data' => $application->fresh()
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to approve document verification stage'
                    ], 500);
                }
            } else {
                // For parallel workflow, we still mark the stage as not approved but don't change overall status
                // The application remains in SSC review for other stages to continue
                $stageStatus = $application->ssc_stage_status ?? [];
                $stageStatus['document_verification'] = [
                    'status' => 'rejected',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'notes' => $request->notes,
                    'document_issues' => $request->document_issues ?? [],
                ];

                $application->update([
                    'ssc_stage_status' => $stageStatus,
                ]);

                AuditLogService::logAction(
                    'SSC_DOCUMENT_VERIFICATION_REVISION_REQUESTED',
                    'Document verification stage marked as needing revision',
                    'ScholarshipApplication',
                    (string) $application->id,
                    [
                        'status' => $previousStatus,
                        'ssc_stage_status' => $previousStageStatus,
                    ],
                    [
                        'status' => $application->status,
                        'ssc_stage_status' => $stageStatus,
                    ],
                    [
                        'application_number' => $application->application_number,
                        'review_stage' => 'document_verification',
                        'reviewed_by' => $reviewerId,
                        'notes' => $request->notes,
                        'document_issues' => $request->document_issues ?? [],
                        'verified' => false,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Document verification stage marked as needing revision.',
                    'data' => $application->fresh()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to submit document verification', [
                'exception' => $e->getMessage(),
                'exception_trace' => $e->getTraceAsString(),
                'application_id' => $application->id,
                'application_status' => $application->status,
                'reviewer_id' => $reviewerId ?? null,
                'request_data' => $request->all(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit document verification',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Submit financial review
     */
    public function sscSubmitFinancialReview(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'feasible' => 'required|boolean',
            'recommended_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'budget_period' => 'nullable|string|max:255',
            'financial_assessment_score' => 'nullable|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For parallel workflow, allow applications in endorsed_to_ssc or ssc_final_approval status
        if (!in_array($application->status, ['endorsed_to_ssc', 'ssc_final_approval'])) {
            return response()->json([
                'success' => false,
                'message' => 'Application is not in SSC review stage'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;
            $previousStatus = $application->status;
            $previousStageStatus = $application->ssc_stage_status ?? null;

            if ($request->feasible) {
                // Use parallel workflow - approve the financial review stage
                $success = $application->approveStage(
                    'financial_review',
                    $reviewerId,
                    $request->notes,
                    [
                        'recommended_amount' => $request->recommended_amount,
                        'budget_period' => $request->budget_period,
                        'financial_assessment_score' => $request->financial_assessment_score,
                        'reviewed_at' => now(),
                    ]
                );

                if ($success) {
                    AuditLogService::logAction(
                        'SSC_FINANCIAL_REVIEW_APPROVED',
                        'Financial review stage approved',
                        'ScholarshipApplication',
                        (string) $application->id,
                        [
                            'status' => $previousStatus,
                            'ssc_stage_status' => $previousStageStatus,
                        ],
                        [
                            'status' => $application->status,
                            'ssc_stage_status' => $application->ssc_stage_status,
                            'recommended_amount' => $request->recommended_amount,
                        ],
                        [
                            'application_number' => $application->application_number,
                            'review_stage' => 'financial_review',
                            'reviewed_by' => $reviewerId,
                            'notes' => $request->notes,
                            'feasible' => true,
                        ]
                    );

                    return response()->json([
                        'success' => true,
                        'message' => 'Financial review approved successfully.',
                        'data' => $application->fresh()
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to approve financial review stage'
                    ], 500);
                }
            } else {
                // For parallel workflow, we still mark the stage as not approved but don't change overall status
                // The application remains in SSC review for other stages to continue
                $stageStatus = $application->ssc_stage_status ?? [];
                $stageStatus['financial_review'] = [
                    'status' => 'rejected',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'notes' => $request->notes,
                    'recommended_amount' => $request->recommended_amount,
                ];

                $application->update([
                    'ssc_stage_status' => $stageStatus,
                ]);

                AuditLogService::logAction(
                    'SSC_FINANCIAL_REVIEW_REVISION_REQUESTED',
                    'Financial review stage marked as needing revision',
                    'ScholarshipApplication',
                    (string) $application->id,
                    [
                        'status' => $previousStatus,
                        'ssc_stage_status' => $previousStageStatus,
                    ],
                    [
                        'status' => $application->status,
                        'ssc_stage_status' => $stageStatus,
                    ],
                    [
                        'application_number' => $application->application_number,
                        'review_stage' => 'financial_review',
                        'reviewed_by' => $reviewerId,
                        'notes' => $request->notes,
                        'feasible' => false,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Financial review stage marked as needing revision.',
                    'data' => $application->fresh()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to submit financial review', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit financial review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit academic review
     */
    public function sscSubmitAcademicReview(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved' => 'required|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For parallel workflow, allow applications in endorsed_to_ssc or ssc_final_approval status
        if (!in_array($application->status, ['endorsed_to_ssc', 'ssc_final_approval'])) {
            return response()->json([
                'success' => false,
                'message' => 'Application is not in SSC review stage'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            Log::info('Academic review attempt', [
                'application_id' => $application->id,
                'auth_user' => $authUser,
                'reviewer_id' => $reviewerId,
                'request_data' => $request->all()
            ]);

            if ($request->approved) {
                // Use parallel workflow - approve the academic review stage
                $success = $application->approveStage(
                    'academic_review',
                    $reviewerId,
                    $request->notes,
                    [
                        'reviewed_at' => now(),
                    ]
                );

                if ($success) {
                    AuditLogService::logAction(
                        'SSC_ACADEMIC_REVIEW_APPROVED',
                        'Academic review stage approved',
                        'ScholarshipApplication',
                        (string) $application->id,
                        [
                            'status' => $previousStatus,
                        ],
                        [
                            'status' => $application->status,
                        ],
                        [
                            'application_number' => $application->application_number,
                            'review_stage' => 'academic_review',
                            'reviewed_by' => $reviewerId,
                            'notes' => $request->notes,
                            'approved' => true,
                        ]
                    );

                    return response()->json([
                        'success' => true,
                        'message' => 'Academic review stage approved successfully.',
                        'data' => $application->fresh()
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to approve academic review stage'
                    ], 500);
                }
            } else {
                // For parallel workflow, we still mark the stage as not approved but don't change overall status
                // The application remains in SSC review for other stages to continue
                $stageStatus = $application->ssc_stage_status ?? [];
                $stageStatus['academic_review'] = [
                    'status' => 'rejected',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'notes' => $request->notes,
                ];

                $application->update([
                    'ssc_stage_status' => $stageStatus,
                ]);

                AuditLogService::logAction(
                    'SSC_ACADEMIC_REVIEW_REVISION_REQUESTED',
                    'Academic review stage marked as needing revision',
                    'ScholarshipApplication',
                    (string) $application->id,
                    [
                        'status' => $previousStatus,
                    ],
                    [
                        'status' => $application->status,
                        'ssc_stage_status' => $stageStatus,
                    ],
                    [
                        'application_number' => $application->application_number,
                        'review_stage' => 'academic_review',
                        'reviewed_by' => $reviewerId,
                        'notes' => $request->notes,
                        'approved' => false,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Academic review stage marked as needing revision.',
                    'data' => $application->fresh()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to submit academic review', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'application_id' => $application->id,
                'request_data' => $request->all(),
                'auth_user' => $request->get('auth_user')
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit academic review',
                'error' => $e->getMessage(),
                'debug' => [
                    'application_id' => $application->id,
                    'error_details' => $e->getMessage()
                ]
            ], 500);
        }
    }

    /**
     * Chairperson final approval
     */
    public function sscFinalApproval(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'ssc_final_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Application is not in final approval stage'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;
            $reviewerRole = $authUser['role'] ?? 'unknown';

            // Get all previous reviews for summary
            $allReviews = $application->sscReviews()->with('application')->get();
            $reviewsData = $allReviews->map(function ($review) {
                return [
                    'stage' => $review->review_stage,
                    'reviewer_role' => $review->reviewer_role,
                    'status' => $review->status,
                    'notes' => $review->review_notes,
                    'data' => $review->review_data,
                    'reviewed_at' => $review->reviewed_at,
                ];
            })->toArray();

            // Create final review record
            $review = \App\Models\SscReview::createForApplication(
                $application,
                'final_approval',
                $reviewerId,
                $reviewerRole
            );

            $review->approve($request->notes, [
                'approved_amount' => $request->approved_amount,
                'reviewed_at' => now(),
            ]);

            // Create final decision record
            \App\Models\SscDecision::create([
                'application_id' => $application->id,
                'decision' => 'approved',
                'approved_amount' => $request->approved_amount,
                'notes' => $request->notes,
                'decided_by' => $reviewerId,
                'decided_at' => now(),
                'review_stage' => 'final_approval',
                'all_reviews_data' => $reviewsData,
            ]);

            $previousStatus = $application->status;

            // Update application
            $application->update([
                'status' => 'approved',
                'approved_amount' => $request->approved_amount,
                'approved_at' => now(),
                'approved_by' => $reviewerId,
                'notes' => $request->notes,
            ]);

            $application->statusHistory()->create([
                'status' => 'approved',
                'notes' => 'Approved by SSC Chairperson: ' . $request->notes,
                'changed_by' => $reviewerId,
                'changed_at' => now(),
            ]);

            // Auto-register student in Student Registry
            try {
                $studentController = new \App\Http\Controllers\StudentController();
                $studentData = $this->extractStudentDataForRegistration($application);
                $scholarshipData = [
                    'application_number' => $application->application_number,
                    'category_id' => $application->category_id,
                    'subcategory_id' => $application->subcategory_id,
                    'approved_amount' => $request->approved_amount,
                    'approved_at' => now()->toISOString(),
                    'approved_by' => $reviewerId
                ];

                // Create a mock request for the student controller
                $studentRequest = new \Illuminate\Http\Request();
                $studentRequest->merge([
                    'application_id' => $application->id,
                    'student_data' => $studentData,
                    'scholarship_data' => $scholarshipData,
                    'auth_user' => $request->get('auth_user')
                ]);

                $studentResponse = $studentController->registerFromScholarship($studentRequest);
                $studentResult = json_decode($studentResponse->getContent(), true);

                if ($studentResult['success']) {
                    Log::info('Student auto-registered successfully', [
                        'application_id' => $application->id,
                        'student_id' => $studentResult['data']['id'] ?? 'unknown'
                    ]);
                } else {
                    Log::warning('Student auto-registration failed', [
                        'application_id' => $application->id,
                        'error' => $studentResult['message'] ?? 'Unknown error'
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Student auto-registration failed with exception', [
                    'application_id' => $application->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // Don't fail the approval if student registration fails
            }

            DB::commit();

            AuditLogService::logAction(
                'SSC_FINAL_APPROVAL',
                'Application finally approved by SSC Chairperson',
                'ScholarshipApplication',
                (string) $application->id,
                [
                    'status' => $previousStatus,
                ],
                [
                    'status' => $application->status,
                    'approved_amount' => $request->approved_amount,
                ],
                [
                    'application_number' => $application->application_number,
                    'approved_by' => $reviewerId,
                    'notes' => $request->notes,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application approved successfully.',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to submit final approval', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit final approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chairperson final rejection
     */
    public function sscFinalRejection(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($application->status !== 'ssc_final_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Application is not in final approval stage'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;

            // Get all previous reviews for summary
            $allReviews = $application->sscReviews()->with('application')->get();
            $reviewsData = $allReviews->map(function ($review) {
                return [
                    'stage' => $review->review_stage,
                    'reviewer_role' => $review->reviewer_role,
                    'status' => $review->status,
                    'notes' => $review->review_notes,
                    'data' => $review->review_data,
                    'reviewed_at' => $review->reviewed_at,
                ];
            })->toArray();

            // Create final review record
            $review = \App\Models\SscReview::createForApplication(
                $application,
                'final_approval',
                $reviewerId,
                'chairperson'
            );

            $review->reject($request->rejection_reason, [
                'rejected_at' => now(),
            ]);

            // Create final decision record
            \App\Models\SscDecision::create([
                'application_id' => $application->id,
                'decision' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'decided_by' => $reviewerId,
                'decided_at' => now(),
                'review_stage' => 'final_approval',
                'all_reviews_data' => $reviewsData,
            ]);

            $previousStatus = $application->status;

            // Update application
            $application->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'reviewed_at' => now(),
                'reviewed_by' => $reviewerId,
            ]);

            $application->statusHistory()->create([
                'status' => 'rejected',
                'notes' => 'Rejected by SSC Chairperson: ' . $request->rejection_reason,
                'changed_by' => $reviewerId,
                'changed_at' => now(),
            ]);

            DB::commit();

            AuditLogService::logAction(
                'SSC_FINAL_REJECTION',
                'Application finally rejected by SSC Chairperson',
                'ScholarshipApplication',
                (string) $application->id,
                [
                    'status' => $previousStatus,
                ],
                [
                    'status' => $application->status,
                ],
                [
                    'application_number' => $application->application_number,
                    'rejected_by' => $reviewerId,
                    'rejection_reason' => $request->rejection_reason,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application rejected.',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to submit final rejection', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit final rejection',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request revision at any stage
     */
    public function sscRequestRevision(Request $request, ScholarshipApplication $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'stage' => 'required|string|in:document_verification,financial_review,academic_review',
            'notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $reviewerId = $authUser['id'] ?? null;
            $previousStatus = $application->status;

            // Create revision request
            $review = \App\Models\SscReview::createForApplication(
                $application,
                $request->stage,
                $reviewerId,
                $authUser['role'] ?? 'unknown'
            );

            $review->requestRevision($request->notes);

            // Send application back to appropriate stage or for_compliance
            if ($request->stage === 'document_verification') {
                $application->update(['status' => 'for_compliance']);
                $application->statusHistory()->create([
                    'status' => 'for_compliance',
                    'notes' => 'Revision requested: ' . $request->notes,
                    'changed_by' => $reviewerId,
                    'changed_at' => now(),
                ]);
            } else {
                // Send back to previous stage
                $stageMapping = [
                    'financial_review' => 'ssc_document_verification',
                    'academic_review' => 'ssc_financial_review',
                ];

                $newStatus = $stageMapping[$request->stage] ?? 'for_compliance';
                $application->update(['status' => $newStatus]);
                $application->statusHistory()->create([
                    'status' => $newStatus,
                    'notes' => 'Revision requested: ' . $request->notes,
                    'changed_by' => $reviewerId,
                    'changed_at' => now(),
                ]);
            }

            DB::commit();

            AuditLogService::logAction(
                'SSC_REVISION_REQUESTED',
                'Revision requested by SSC reviewer',
                'ScholarshipApplication',
                (string) $application->id,
                [
                    'status' => $previousStatus,
                ],
                [
                    'status' => $application->status,
                ],
                [
                    'application_number' => $application->application_number,
                    'requested_by' => $reviewerId,
                    'stage' => $request->stage,
                    'notes' => $request->notes,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Revision requested successfully.',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to request revision', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to request revision',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get review history for application
     */
    public function getSscReviewHistory(Request $request, ScholarshipApplication $application): JsonResponse
    {
        try {
            $reviews = $application->sscReviews()
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC review history', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch review history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user's SSC roles and permissions
     */
    public function getUserSscRoles(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');

            if (!$authUser || !isset($authUser['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userId = $authUser['id'];

            // Get user's active SSC role assignments
            $assignments = \App\Models\SscMemberAssignment::where('user_id', $userId)
                ->where('is_active', true)
                ->get();

            if ($assignments->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'has_ssc_role' => false,
                        'roles' => [],
                        'stages' => [],
                        'is_chairperson' => false,
                        'permissions' => []
                    ]
                ]);
            }

            // Extract roles and stages
            $roles = $assignments->pluck('ssc_role')->unique()->values()->toArray();
            $stages = $assignments->pluck('review_stage')->unique()->values()->toArray();
            $isChairperson = in_array('chairperson', $roles);

            // Determine permissions based on roles
            $permissions = [];
            foreach ($assignments as $assignment) {
                $permissions[] = [
                    'ssc_role' => $assignment->ssc_role,
                    'review_stage' => $assignment->review_stage,
                    'can_review' => true,
                    'can_approve' => true,
                    'can_reject' => true,
                ];
            }

            // Map role to display labels - Simplified roles
            $roleLabels = [
                'chairperson' => 'SSC Chairperson',
                'city_council' => 'Document Verification Officer',
                'budget_dept' => 'Financial Review Officer',
                'education_affairs' => 'Academic Review Officer',
            ];

            // Map stage to display labels
            $stageLabels = [
                'document_verification' => 'Document Verification',
                'financial_review' => 'Financial Review',
                'academic_review' => 'Academic Review',
                'final_approval' => 'Final Approval',
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'has_ssc_role' => true,
                    'user_id' => $userId,
                    'roles' => $roles,
                    'stages' => $stages,
                    'is_chairperson' => $isChairperson,
                    'permissions' => $permissions,
                    'role_labels' => array_map(fn($role) => $roleLabels[$role] ?? $role, $roles),
                    'stage_labels' => array_map(fn($stage) => $stageLabels[$stage] ?? $stage, $stages),
                    'assignments' => $assignments->map(function ($assignment) use ($roleLabels, $stageLabels) {
                        return [
                            'id' => $assignment->id,
                            'ssc_role' => $assignment->ssc_role,
                            'role_label' => $roleLabels[$assignment->ssc_role] ?? $assignment->ssc_role,
                            'review_stage' => $assignment->review_stage,
                            'stage_label' => $stageLabels[$assignment->review_stage] ?? $assignment->review_stage,
                            'is_active' => $assignment->is_active,
                            'assigned_at' => $assignment->assigned_at,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch user SSC roles', [
                'exception' => $e->getMessage(),
                'user_id' => $authUser['id'] ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get SSC member assignments
     */
    public function getSSCMemberAssignments(Request $request): JsonResponse
    {
        try {
            $assignments = \App\Models\SscMemberAssignment::with([])
                ->orderBy('ssc_role')
                ->orderBy('is_active', 'desc')
                ->get();

            // Transform the data to include user information and review statistics
            $members = $assignments->map(function ($assignment) {
                // Get review count for this member
                $reviewCount = \App\Models\SscReview::where('reviewer_id', $assignment->user_id)
                    ->where('review_stage', $assignment->review_stage)
                    ->count();

                // Get last review date
                $lastReview = \App\Models\SscReview::where('reviewer_id', $assignment->user_id)
                    ->where('review_stage', $assignment->review_stage)
                    ->latest('reviewed_at')
                    ->first();

                // Map role to display label
                $roleLabels = [
                    'chairperson' => 'SSC Chairperson',
                    'budget_dept' => 'Budget Department',
                    'accounting' => 'Accounting Department',
                    'treasurer' => 'City Treasurer',
                    'education_affairs' => 'Education Affairs Unit',
                    'qcydo' => 'Quezon City Youth Development Office',
                    'planning_dept' => 'City Planning and Development Department',
                    'city_council' => 'City Council',
                    'hrd' => 'Human Resource Management Department',
                    'social_services' => 'Social Services Development Department',
                    'schools_division' => 'Schools Division Office',
                    'qcu' => 'Quezon City University',
                ];

                // Map stage to display label
                $stageLabels = [
                    'document_verification' => 'Document Verification',
                    'financial_review' => 'Financial Review',
                    'academic_review' => 'Academic Review',
                    'final_approval' => 'Final Approval',
                ];

                // Mock user data - in production, this would come from auth service
                $userData = $this->getMockUserData($assignment->user_id);

                return [
                    'id' => $assignment->id,
                    'user_id' => $assignment->user_id,
                    'user_name' => $userData['name'],
                    'user_email' => $userData['email'],
                    'ssc_role' => $assignment->ssc_role,
                    'role_label' => $roleLabels[$assignment->ssc_role] ?? $assignment->ssc_role,
                    'review_stage' => $assignment->review_stage,
                    'stage_label' => $stageLabels[$assignment->review_stage] ?? $assignment->review_stage,
                    'is_active' => $assignment->is_active,
                    'assigned_at' => $assignment->assigned_at,
                    'review_count' => $reviewCount,
                    'last_review' => $lastReview ? $lastReview->reviewed_at : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $members
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch SSC member assignments', [
                'exception' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC member assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mock user data - in production, this would be fetched from auth service
     */
    private function getMockUserData($userId): array
    {
        $mockUsers = [
            1 => ['name' => 'Hon. Dale Gonzalo C. Malapitan', 'email' => 'mayor@caloocan.gov.ph'],
            2 => ['name' => 'Hon. Maria Luisa C. Santos', 'email' => 'council.education@caloocan.gov.ph'],
            3 => ['name' => 'Atty. Roberto M. Cruz', 'email' => 'hrd@caloocan.gov.ph'],
            4 => ['name' => 'Dr. Ana Maria L. Reyes', 'email' => 'social.services@caloocan.gov.ph'],
            5 => ['name' => 'Engr. Carlos P. Mendoza', 'email' => 'budget@caloocan.gov.ph'],
            6 => ['name' => 'CPA Maria Elena S. Torres', 'email' => 'accounting@caloocan.gov.ph'],
            7 => ['name' => 'CPA Juan Carlos D. Villanueva', 'email' => 'treasurer@caloocan.gov.ph'],
            8 => ['name' => 'Dr. Patricia A. Dela Cruz', 'email' => 'education.affairs@caloocan.gov.ph'],
            9 => ['name' => 'Ms. Jennifer L. Morales', 'email' => 'qcydo@caloocan.gov.ph'],
            10 => ['name' => 'Arch. Miguel R. Santiago', 'email' => 'planning@caloocan.gov.ph'],
            11 => ['name' => 'Dr. Rosario M. Bautista', 'email' => 'schools.division@caloocan.gov.ph'],
            12 => ['name' => 'Dr. Francisco J. Aguilar', 'email' => 'qcu@caloocan.gov.ph'],
            13 => ['name' => 'Hon. Ricardo T. Gutierrez', 'email' => 'council.education.alt@caloocan.gov.ph'],
            14 => ['name' => 'Ms. Lourdes C. Fernandez', 'email' => 'budget.alt@caloocan.gov.ph'],
            15 => ['name' => 'Dr. Antonio M. Rodriguez', 'email' => 'education.affairs.alt@caloocan.gov.ph'],
        ];

        return $mockUsers[$userId] ?? ['name' => 'Unknown User', 'email' => 'unknown@caloocan.gov.ph'];
    }

    /**
     * Approve a specific stage (parallel workflow)
     */
    public function approveStage(Request $request, ScholarshipApplication $application): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');

            if (!$authUser || !isset($authUser['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userId = $authUser['id'];
            $stage = $request->input('stage');
            $notes = $request->input('notes');
            $reviewData = $request->input('review_data', []);

            // Validate stage
            $validStages = ['document_verification', 'financial_review', 'academic_review'];
            if (!in_array($stage, $validStages)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid stage'
                ], 400);
            }

            // Check if user has permission for this stage
            $userAssignment = \App\Models\SscMemberAssignment::where('user_id', $userId)
                ->where('review_stage', $stage)
                ->where('is_active', true)
                ->first();

            if (!$userAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authorized for this stage'
                ], 403);
            }

            // Approve the stage
            $success = $application->approveStage($stage, $userId, $notes, $reviewData);

            if ($success) {
                AuditLogService::logAction(
                    'SSC_STAGE_APPROVED',
                    'SSC stage approved via generic endpoint',
                    'ScholarshipApplication',
                    (string) $application->id,
                    null,
                    [
                        'stage' => $stage,
                        'review_data' => $reviewData,
                    ],
                    [
                        'application_number' => $application->application_number,
                        'reviewed_by' => $userId,
                        'notes' => $notes,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => "Stage {$stage} approved successfully",
                    'data' => $application->fresh()
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to approve stage'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to approve stage', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
                'stage' => $request->input('stage'),
                'user_id' => $authUser['id'] ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve stage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract student data for registration from application
     */
    private function extractStudentDataForRegistration($application)
    {
        $student = $application->student;
        $school = $application->school;

        return [
            'first_name' => $student->first_name,
            'middle_name' => $student->middle_name,
            'last_name' => $student->last_name,
            'email' => $student->email_address,
            'contact_number' => $student->contact_number,
            'citizen_id' => $student->citizen_id,
            'current_school_id' => $school->id ?? $application->school_id,
            'year_level' => $student->year_level ?? '',
            'program' => $student->program ?? '',
            'enrollment_date' => now()->toISOString(),
            'academic_status' => 'enrolled',
            'gpa' => $student->gpa ?? 0,
        ];
    }

    /**
     * Get application counts for notifications (public endpoint)
     */
    public function getApplicationCounts()
    {
        try {
            $counts = [
                'submitted' => ScholarshipApplication::where('status', 'submitted')->count(),
                'under_review' => ScholarshipApplication::where('status', 'under_review')->count(),
                'approved' => ScholarshipApplication::where('status', 'approved')->count(),
                'rejected' => ScholarshipApplication::where('status', 'rejected')->count(),
                'total' => ScholarshipApplication::count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $counts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application counts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard overview statistics and recent activities
     */
    public function getDashboardOverview(Request $request): JsonResponse
    {
        try {
            // Calculate statistics
            // Calculate statistics
            // Get active school year and semester from the current academic period
            $activePeriod = AcademicPeriod::current()->first();

            $activeSchoolYear = $activePeriod ? $activePeriod->academic_year : 'N/A';
            $activeSemester = 'N/A';

            if ($activePeriod) {
                if ($activePeriod->period_type === 'Semester') {
                    $activeSemester = $activePeriod->period_number == 1 ? '1st Semester' :
                        ($activePeriod->period_number == 2 ? '2nd Semester' : 'Summer');
                } else {
                    $activeSemester = $activePeriod->period_number == 1 ? '1st Trimester' :
                        ($activePeriod->period_number == 2 ? '2nd Trimester' : '3rd Trimester');
                }
            }

            $stats = [
                'totalApplications' => ScholarshipApplication::count(),
                'pendingReview' => ScholarshipApplication::where('status', 'submitted')->count(),
                // Grouping several statuses under "underReview"
                'underReview' => ScholarshipApplication::whereIn('status', [
                    'documents_reviewed',
                    'for_compliance',
                    'compliance_documents_submitted',
                    'approved_pending_verification'
                ])->count(),
                'approved' => ScholarshipApplication::where('status', 'approved')->count(),
                'rejected' => ScholarshipApplication::where('status', 'rejected')->count(),
                'verifiedStudents' => ScholarshipApplication::where('status', 'enrollment_verified')->count(),
                'scheduledInterviews' => ScholarshipApplication::where('status', 'interview_scheduled')->count(),
                'endorsedToSSC' => ScholarshipApplication::whereIn('status', [
                    'endorsed_to_ssc',
                    'ssc_document_verification',
                    'ssc_financial_review',
                    'ssc_academic_review',
                    'ssc_final_approval'
                ])->count(),
                'activeSchoolYear' => $activeSchoolYear,
                'activeSemester' => $activeSemester,
            ];

            // Get recent activities
            $recentActivities = ApplicationStatusHistory::with(['application.student'])
                ->orderBy('changed_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($history) {
                    $studentName = $history->application && $history->application->student
                        ? $history->application->student->first_name . ' ' . $history->application->student->last_name
                        : 'Unknown Student';

                    return [
                        'id' => $history->id,
                        'type' => $this->mapStatusToActivityType($history->status),
                        'message' => $this->formatActivityMessage($history->status, $studentName, $history->notes),
                        'time' => Carbon::parse($history->changed_at)->diffForHumans(),
                        'status' => $history->status,
                        'raw_time' => $history->changed_at
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'recentActivities' => $recentActivities
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get dashboard overview: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get applications data for reports (JSON)
     */
    public function getApplicationsReportData(Request $request): JsonResponse
    {
        try {
            $query = ScholarshipApplication::with(['student', 'school', 'category', 'subcategory']);

            $authUser = $request->get('auth_user');

            // Filter for partner school representatives
            if ($authUser && isset($authUser['role']) && $authUser['role'] === 'ps_rep') {
                if (isset($authUser['citizen_id'])) {
                    $partnerRep = \App\Models\PartnerSchoolRepresentative::findByCitizenId($authUser['citizen_id']);

                    if ($partnerRep) {
                        $query->where('school_id', $partnerRep->school_id);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                } else {
                    $query->whereRaw('1 = 0');
                }
            }

            // Apply filters
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            }

            $applications = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);

        } catch (\Exception $e) {
            Log::error('Report data fetch failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch report data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export applications to CSV
     */
    public function exportApplications(Request $request)
    {
        try {
            $filename = 'scholarship_applications_' . date('Y-m-d_His') . '.csv';

            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=$filename",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $callback = function () use ($request) {
                $file = fopen('php://output', 'w');

                // CSV Header
                fputcsv($file, [
                    'Application Number',
                    'Student Name',
                    'Email',
                    'School',
                    'Category',
                    'Subcategory',
                    'Status',
                    'Applied Date',
                    'Last Updated'
                ]);

                // Query with filters (reusing logic from index if needed, but simplified here)
                $query = ScholarshipApplication::with(['student', 'school', 'category', 'subcategory']);

                // Apply rudimentary filters
                if ($request->has('status')) {
                    $query->where('status', $request->status);
                }
                if ($request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
                }

                $query->chunk(100, function ($applications) use ($file) {
                    foreach ($applications as $app) {
                        fputcsv($file, [
                            $app->application_number,
                            $app->student ? $app->student->first_name . ' ' . $app->student->last_name : 'N/A',
                            $app->student ? $app->student->email : 'N/A',
                            $app->school ? $app->school->name : 'N/A',
                            $app->category ? $app->category->name : 'N/A',
                            $app->subcategory ? $app->subcategory->name : 'N/A',
                            ucwords(str_replace('_', ' ', $app->status)),
                            $app->created_at->format('Y-m-d H:i:s'),
                            $app->updated_at->format('Y-m-d H:i:s')
                        ]);
                    }
                });

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Export failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function mapStatusToActivityType($status)
    {
        if (str_contains($status, 'approved'))
            return 'approval';
        if (str_contains($status, 'rejected'))
            return 'rejection';
        if (str_contains($status, 'interview'))
            return 'interview';
        if (str_contains($status, 'endorsed') || str_contains($status, 'ssc'))
            return 'endorsement';
        if ($status === 'submitted')
            return 'application';
        return 'update';
    }

    private function formatActivityMessage($status, $studentName, $notes)
    {
        switch ($status) {
            case 'submitted':
                return "New application submitted by $studentName";
            case 'approved':
                return "Application approved for $studentName";
            case 'rejected':
                return "Application rejected for $studentName";
            case 'documents_reviewed':
                return "Documents reviewed for $studentName";
            case 'interview_scheduled':
                return "Interview scheduled for $studentName";
            case 'interview_completed':
                return "Interview completed for $studentName";
            case 'endorsed_to_ssc':
                return "Endorsed to SSC: $studentName";
            case 'grants_disbursed':
                return "Grant disbursed to $studentName";
            default:
                return "Status updated to " . str_replace('_', ' ', $status) . " for $studentName";
        }
    }
}
