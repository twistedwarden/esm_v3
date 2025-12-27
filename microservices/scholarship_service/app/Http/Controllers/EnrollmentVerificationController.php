<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentVerification;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\School;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EnrollmentVerificationController extends Controller
{
    /**
     * Display a listing of enrollment verifications
     */
    public function index(Request $request): JsonResponse
    {
        // Get applications that are ready for verification (approved_pending_verification status)
        $applicationsQuery = \App\Models\ScholarshipApplication::with([
            'student',
            'category',
            'subcategory',
            'school'
        ])->where('status', 'approved_pending_verification');

        $authUser = $request->get('auth_user');

        // Filter for partner school representatives
        if ($authUser && isset($authUser['role']) && $authUser['role'] === 'ps_rep') {
            if (isset($authUser['citizen_id'])) {
                $partnerRep = \App\Models\PartnerSchoolRepresentative::findByCitizenId($authUser['citizen_id']);
                
                if ($partnerRep) {
                    $applicationsQuery->where('school_id', $partnerRep->school_id);
                } else {
                    $applicationsQuery->whereRaw('1 = 0');
                }
            } else {
                $applicationsQuery->whereRaw('1 = 0');
            }
        }

        // Get existing enrollment verifications
        $verificationsQuery = EnrollmentVerification::with([
            'application.student',
            'application.category',
            'application.subcategory',
            'student',
            'school',
            'enrollmentProofDocument'
        ]);

        // Apply same filters to verifications
        if ($authUser && isset($authUser['role']) && $authUser['role'] === 'ps_rep') {
            if (isset($authUser['citizen_id'])) {
                $partnerRep = \App\Models\PartnerSchoolRepresentative::findByCitizenId($authUser['citizen_id']);
                
                if ($partnerRep) {
                    $verificationsQuery->where('school_id', $partnerRep->school_id);
                } else {
                    $verificationsQuery->whereRaw('1 = 0');
                }
            } else {
                $verificationsQuery->whereRaw('1 = 0');
            }
        }

        // Apply filters to applications
        if ($request->has('school_id')) {
            $applicationsQuery->where('school_id', $request->school_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $applicationsQuery->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id_number', 'like', "%{$search}%");
            });
        }

        // Apply filters to verifications
        if ($request->has('status')) {
            $verificationsQuery->where('verification_status', $request->status);
        }

        if ($request->has('school_id')) {
            $verificationsQuery->where('school_id', $request->school_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $verificationsQuery->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id_number', 'like', "%{$search}%");
            });
        }

        // Get applications ready for verification
        $applications = $applicationsQuery->orderBy('created_at', 'desc')->get();
        
        // Get existing verifications
        $verifications = $verificationsQuery->orderBy('created_at', 'desc')->get();

        // Transform applications to verification format
        $transformedApplications = $applications->map(function($app) {
            return [
                'id' => 'pending_' . $app->id, // Prefix to distinguish from real verifications
                'application_id' => $app->id,
                'student_id' => $app->student_id,
                'school_id' => $app->school_id,
                'verification_status' => 'pending',
                'enrollment_proof_document_id' => null,
                'verified_by' => null,
                'verified_at' => null,
                'verification_notes' => null,
                'enrollment_year' => null,
                'enrollment_term' => null,
                'is_currently_enrolled' => null,
                'created_at' => $app->created_at,
                'updated_at' => $app->updated_at,
                'application' => $app,
                'student' => $app->student,
                'school' => $app->school,
                'enrollment_proof_document' => null,
                'is_pending_verification' => true // Flag to identify pending applications
            ];
        });

        // Combine and sort
        $allItems = $transformedApplications->concat($verifications)->sortByDesc('created_at');

        // Simple pagination
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = $allItems->slice($offset, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'current_page' => $page,
                'data' => $paginatedItems,
                'first_page_url' => null,
                'from' => $offset + 1,
                'last_page' => ceil($allItems->count() / $perPage),
                'last_page_url' => null,
                'next_page_url' => $page < ceil($allItems->count() / $perPage) ? "?page=" . ($page + 1) : null,
                'path' => $request->url(),
                'per_page' => $perPage,
                'prev_page_url' => $page > 1 ? "?page=" . ($page - 1) : null,
                'to' => min($offset + $perPage, $allItems->count()),
                'total' => $allItems->count()
            ]
        ]);
    }

    /**
     * Display the specified verification
     */
    public function show(EnrollmentVerification $verification): JsonResponse
    {
        $verification->load([
            'application.student.addresses',
            'application.student.familyMembers',
            'application.student.academicRecords',
            'application.student.currentAcademicRecord',
            'application.student.financialInformation',
            'application.category',
            'application.subcategory',
            'student',
            'school',
            'enrollmentProofDocument'
        ]);

        return response()->json([
            'success' => true,
            'data' => $verification
        ]);
    }

    /**
     * Submit enrollment proof for verification
     */
    public function submitEnrollmentProof(Request $request, ScholarshipApplication $application): JsonResponse
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

            // Create or update enrollment verification
            $verification = EnrollmentVerification::updateOrCreate(
                ['application_id' => $application->id],
                [
                    'student_id' => $application->student_id,
                    'school_id' => $application->school_id,
                    'verification_status' => 'pending',
                    'enrollment_proof_document_id' => $request->enrollment_proof_document_id,
                    'enrollment_year' => $request->enrollment_year,
                    'enrollment_term' => $request->enrollment_term,
                    'is_currently_enrolled' => $request->is_currently_enrolled,
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment proof submitted successfully',
                'data' => $verification
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to submit enrollment proof', [
                'exception' => $e->getMessage(),
                'application_id' => $application->id,
                'payload' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit enrollment proof',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve enrollment verification
     */
    public function approve(Request $request, EnrollmentVerification $verification): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$verification->canBeVerified()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification cannot be approved in current status'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $verifiedBy = $authUser['id'] ?? null;

            $verification->verify($verifiedBy, $request->verification_notes);

            // Update application status
            $verification->application->confirmEnrollment($verification->id, $verifiedBy);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment verification approved successfully',
                'data' => $verification->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve enrollment verification', [
                'exception' => $e->getMessage(),
                'verification_id' => $verification->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve enrollment verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject enrollment verification
     */
    public function reject(Request $request, EnrollmentVerification $verification): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'verification_notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$verification->canBeRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification cannot be rejected in current status'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $rejectedBy = $authUser['id'] ?? null;

            $verification->reject($rejectedBy, $request->verification_notes);

            // Update application status to rejected
            $verification->application->update([
                'status' => 'rejected',
                'rejection_reason' => 'Enrollment verification failed: ' . $request->verification_notes,
                'reviewed_at' => now(),
                'reviewed_by' => $rejectedBy,
            ]);

            $verification->application->statusHistory()->create([
                'status' => 'rejected',
                'notes' => 'Enrollment verification rejected: ' . $request->verification_notes,
                'changed_by' => $rejectedBy,
                'changed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment verification rejected',
                'data' => $verification->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reject enrollment verification', [
                'exception' => $e->getMessage(),
                'verification_id' => $verification->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject enrollment verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Flag verification for review
     */
    public function flagForReview(Request $request, EnrollmentVerification $verification): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'verification_notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$verification->canBeReviewed()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification cannot be flagged for review in current status'
            ], 400);
        }

        try {
            $verification->needsReview($request->verification_notes);

            return response()->json([
                'success' => true,
                'message' => 'Verification flagged for review',
                'data' => $verification->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to flag verification for review', [
                'exception' => $e->getMessage(),
                'verification_id' => $verification->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to flag verification for review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verification statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_verifications' => EnrollmentVerification::count(),
            'pending_verifications' => EnrollmentVerification::pending()->count(),
            'verified_verifications' => EnrollmentVerification::verified()->count(),
            'rejected_verifications' => EnrollmentVerification::rejected()->count(),
            'needs_review_verifications' => EnrollmentVerification::needsReview()->count(),
            'by_school' => EnrollmentVerification::selectRaw('school_id, verification_status, COUNT(*) as count')
                ->with('school:id,name')
                ->groupBy('school_id', 'verification_status')
                ->get()
                ->groupBy('school_id'),
            'by_month' => EnrollmentVerification::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, verification_status, COUNT(*) as count')
                ->groupBy('month', 'verification_status')
                ->orderBy('month')
                ->get()
                ->groupBy('month'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}






