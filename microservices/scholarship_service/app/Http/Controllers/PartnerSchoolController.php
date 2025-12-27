<?php

namespace App\Http\Controllers;

use App\Models\PartnerSchoolRepresentative;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\PartnerSchoolEnrollmentData;
use App\Models\FlexibleStudentData;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PartnerSchoolController extends Controller
{
    /**
     * Get school information for the authenticated partner school representative
     */
    public function getSchoolInfo(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $school = $representative->school;
            
            Log::info('Partner school info requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $school->id,
                'school_name' => $school->name
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'school' => [
                        'id' => $school->id,
                        'name' => $school->name,
                        'campus' => $school->campus,
                        'full_name' => $school->full_name,
                        'contact_number' => $school->contact_number,
                        'email' => $school->email,
                        'website' => $school->website,
                        'address' => $school->address,
                        'city' => $school->city,
                        'province' => $school->province,
                        'region' => $school->region,
                        'zip_code' => $school->zip_code,
                        'classification' => $school->classification,
                        'is_public' => $school->is_public,
                        'is_partner_school' => $school->is_partner_school,
                    ],
                    'representative' => [
                        'citizen_id' => $representative->citizen_id,
                        'assigned_at' => $representative->assigned_at,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching partner school info', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch school information.'
            ], 500);
        }
    }

    /**
     * Get statistics for the partner school
     */
    public function getStats(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Get statistics
            $totalApplications = ScholarshipApplication::where('school_id', $schoolId)->count();
            $pendingApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'pending')->count();
            $approvedApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'approved')->count();
            $rejectedApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'rejected')->count();

            // Get recent activity (last 30 days)
            $recentApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('created_at', '>=', now()->subDays(30))
                ->count();

            Log::info('Partner school stats requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'total_applications' => $totalApplications
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_applications' => $totalApplications,
                    'pending_applications' => $pendingApplications,
                    'approved_applications' => $approvedApplications,
                    'rejected_applications' => $rejectedApplications,
                    'recent_applications' => $recentApplications,
                    'school_id' => $schoolId,
                    'school_name' => $representative->school->name,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching partner school stats', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch school statistics.'
            ], 500);
        }
    }

    /**
     * Get students for the partner school
     */
    public function getStudents(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Get students who have applications for this school OR enrollment data
            $query = Student::where(function($q) use ($schoolId) {
                $q->whereHas('scholarshipApplications', function($subQ) use ($schoolId) {
                    $subQ->where('school_id', $schoolId);
                })->orWhereHas('enrollmentData', function($subQ) use ($schoolId) {
                    $subQ->where('school_id', $schoolId);
                });
            })->with([
                'currentAcademicRecord', 
                'scholarshipApplications' => function($q) use ($schoolId) {
                    $q->where('school_id', $schoolId);
                },
                'enrollmentData' => function($q) use ($schoolId) {
                    $q->where('school_id', $schoolId);
                }
            ]);

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id_number', 'like', "%{$search}%")
                      ->orWhereHas('enrollmentData', function($subQ) use ($search) {
                          $subQ->where('first_name', 'like', "%{$search}%")
                               ->orWhere('last_name', 'like', "%{$search}%")
                               ->orWhere('student_id_number', 'like', "%{$search}%");
                      });
                });
            }

            // Apply status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where(function($q) use ($schoolId, $request) {
                    $q->whereHas('scholarshipApplications', function($subQ) use ($schoolId, $request) {
                        $subQ->where('school_id', $schoolId)
                             ->where('status', $request->status);
                    })->orWhereHas('enrollmentData', function($subQ) use ($schoolId, $request) {
                        // For enrollment data, map status to enrollment status
                        if ($request->status === 'active') {
                            $subQ->where('school_id', $schoolId)
                                 ->where('is_currently_enrolled', true);
                        } elseif ($request->status === 'inactive') {
                            $subQ->where('school_id', $schoolId)
                                 ->where('is_currently_enrolled', false);
                        }
                    });
                });
            }

            $students = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            Log::info('Partner school students requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'total_students' => $students->total(),
                'students_data' => $students->items()
            ]);
            
            // Debug each student's enrollment data
            foreach ($students->items() as $student) {
                Log::info('Student enrollment data debug', [
                    'student_id' => $student->id,
                    'student_id_number' => $student->student_id_number,
                    'enrollment_data_count' => $student->enrollmentData ? $student->enrollmentData->count() : 0,
                    'enrollment_data' => $student->enrollmentData ? $student->enrollmentData->toArray() : []
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $students
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching partner school students', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students.'
            ], 500);
        }
    }

    /**
     * Get applications for verification
     */
    public function getApplicationsForVerification(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Get applications for this school with student and academic record info
            $query = ScholarshipApplication::with(['student.currentAcademicRecord'])
                ->where('school_id', $schoolId);

            // Apply status filter
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'needs_verification') {
                    // Show students who need enrollment verification (is_currently_enrolled = false)
                    $query->whereHas('student', function($q) {
                        $q->where('is_currently_enrolled', false);
                    });
                } else {
                    $query->where('status', $request->status);
                }
            }

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->whereHas('student', function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id_number', 'like', "%{$search}%");
                });
            }

            $applications = $query->orderBy('created_at', 'desc')
                                ->paginate($request->get('per_page', 15));

            // Transform data for frontend
            $transformedApplications = $applications->map(function($app) {
                $student = $app->student;
                $academicRecord = $student->currentAcademicRecord;
                
                // Determine verification status based on enrollment claim and academic record
                $verificationStatus = 'unknown';
                $verificationMessage = 'Status Unknown';
                $verificationColor = 'gray';
                
                if (!$student->is_currently_enrolled && $academicRecord !== null) {
                    $verificationStatus = 'needs_verification';
                    $verificationMessage = '⚠ Needs Enrollment Verification';
                    $verificationColor = 'orange';
                } elseif ($student->is_currently_enrolled && $academicRecord !== null) {
                    $verificationStatus = 'verified_enrolled';
                    $verificationMessage = '✓ Verified Enrolled';
                    $verificationColor = 'green';
                } elseif ($student->is_currently_enrolled && $academicRecord === null) {
                    $verificationStatus = 'claims_enrolled_no_record';
                    $verificationMessage = '✗ Claims Enrolled (No Record)';
                    $verificationColor = 'red';
                } else {
                    $verificationStatus = 'not_enrolled';
                    $verificationMessage = 'Not Enrolled';
                    $verificationColor = 'gray';
                }
                
                return [
                    'id' => $app->id,
                    'applicationNumber' => "APP-{$app->id}",
                    'studentName' => "{$student->first_name} {$student->last_name}",
                    'studentId' => $student->student_id_number,
                    'yearLevel' => $academicRecord ? $academicRecord->year_level : 'UNKNOWN',
                    'program' => $academicRecord ? $academicRecord->program : 'UNKNOWN',
                    'isCurrentlyEnrolled' => $student->is_currently_enrolled,
                    'academicRecordStatus' => $academicRecord ? 'ACTIVE' : 'INACTIVE',
                    'academicRecordExists' => $academicRecord !== null,
                    'verificationStatus' => $verificationStatus,
                    'verificationMessage' => $verificationMessage,
                    'verificationColor' => $verificationColor,
                    'applicationStatus' => $app->status,
                    'submittedAt' => $app->created_at->format('Y-m-d'),
                    'scholarshipType' => $app->scholarship_subcategory_id ? 'Academic Excellence' : 'General',
                    'verificationNotes' => $app->verification_notes ?? 'No notes available'
                ];
            });

            Log::info('Partner school verification applications requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'total_applications' => $applications->total()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'applications' => $transformedApplications,
                    'pagination' => [
                        'current_page' => $applications->currentPage(),
                        'last_page' => $applications->lastPage(),
                        'per_page' => $applications->perPage(),
                        'total' => $applications->total()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching applications for verification', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications for verification.'
            ], 500);
        }
    }

    /**
     * Get verification statistics
     */
    public function getVerificationStats(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Get verification statistics
            $totalApplications = ScholarshipApplication::where('school_id', $schoolId)->count();
            $pendingApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'pending')->count();
            $verifiedApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'approved')->count();
            $rejectedApplications = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'rejected')->count();

            // Calculate verification rate
            $verificationRate = $totalApplications > 0 ? 
                round((($verifiedApplications + $rejectedApplications) / $totalApplications) * 100, 1) : 0;

            // Get recent activity (last 7 days)
            $recentPending = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'pending')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            $recentVerified = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'approved')
                ->where('updated_at', '>=', now()->subDays(7))
                ->count();

            $recentRejected = ScholarshipApplication::where('school_id', $schoolId)
                ->where('status', 'rejected')
                ->where('updated_at', '>=', now()->subDays(7))
                ->count();

            Log::info('Partner school verification stats requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'total_applications' => $totalApplications
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'pending_verification' => $pendingApplications,
                    'pending_this_week' => $recentPending,
                    'verified_students' => $verifiedApplications,
                    'verified_this_week' => $recentVerified,
                    'rejected_applications' => $rejectedApplications,
                    'rejected_this_week' => $recentRejected,
                    'verification_rate' => $verificationRate,
                    'school_id' => $schoolId,
                    'school_name' => $representative->school->name,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching verification stats', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch verification statistics.'
            ], 500);
        }
    }

    /**
     * Update student enrollment status
     */
    public function updateEnrollmentStatus(Request $request, $studentId): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Validate request
            $request->validate([
                'is_currently_enrolled' => 'required|boolean',
                'verification_notes' => 'nullable|string|max:1000'
            ]);

            // Find the student and verify they belong to this school
            $student = Student::whereHas('scholarshipApplications', function($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })->find($studentId);

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or access denied.'
                ], 404);
            }

            // Update enrollment status
            $student->is_currently_enrolled = $request->is_currently_enrolled;
            $student->save();

            // Update verification notes on the latest application
            $latestApplication = ScholarshipApplication::where('student_id', $studentId)
                ->where('school_id', $schoolId)
                ->latest()
                ->first();

            if ($latestApplication) {
                $latestApplication->verification_notes = $request->verification_notes ?? $latestApplication->verification_notes;
                $latestApplication->verified_by = $authUser['citizen_id'];
                $latestApplication->verified_at = now();
                $latestApplication->save();
            }

            Log::info('Student enrollment status updated', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'student_id' => $studentId,
                'is_currently_enrolled' => $request->is_currently_enrolled,
                'verification_notes' => $request->verification_notes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Enrollment status updated successfully.',
                'data' => [
                    'student_id' => $student->id,
                    'student_name' => "{$student->first_name} {$student->last_name}",
                    'is_currently_enrolled' => $student->is_currently_enrolled,
                    'verification_notes' => $request->verification_notes
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating enrollment status', [
                'citizen_id' => $authUser['citizen_id'],
                'student_id' => $studentId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update enrollment status.'
            ], 500);
        }
    }

    /**
     * Verify an application
     */
    public function verifyApplication(Request $request, $applicationId): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Find the application
            $application = ScholarshipApplication::where('id', $applicationId)
                ->where('school_id', $schoolId)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or access denied.'
                ], 404);
            }

            // Validate request
            $request->validate([
                'verification_status' => 'required|in:verified,rejected',
                'verification_notes' => 'nullable|string|max:1000'
            ]);

            // Update application status
            $application->status = $request->verification_status === 'verified' ? 'approved' : 'rejected';
            $application->verification_notes = $request->verification_notes;
            $application->verified_by = $authUser['citizen_id'];
            $application->verified_at = now();
            $application->save();

            Log::info('Application verification completed', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'application_id' => $applicationId,
                'verification_status' => $request->verification_status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application verification completed successfully.',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            Log::error('Error verifying application', [
                'citizen_id' => $authUser['citizen_id'],
                'application_id' => $applicationId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify application.'
            ], 500);
        }
    }

    /**
     * Upload enrollment data CSV file
     */
    public function uploadEnrollmentData(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Validate request
            $validator = Validator::make($request->all(), [
                'csv_data' => 'required|array',
                'update_mode' => 'required|in:merge,replace'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors()
                ], 400);
            }

            $csvData = $request->csv_data;
            $updateMode = $request->update_mode;
            
            Log::info('Starting enrollment data upload', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'csv_rows' => count($csvData),
                'update_mode' => $updateMode
            ]);

            // If replace mode, clear existing data for this school
            if ($updateMode === 'replace') {
                PartnerSchoolEnrollmentData::where('school_id', $schoolId)->delete();
            }

            $processed = 0;
            $errors = [];
            $warnings = [];

            DB::beginTransaction();

            try {
                foreach ($csvData as $index => $row) {
                    try {
                        // Convert string boolean to actual boolean
                        if (isset($row['is_currently_enrolled'])) {
                            $value = strtolower(trim($row['is_currently_enrolled']));
                            if (in_array($value, ['true', '1', 'yes', 'y', 'on'])) {
                                $row['is_currently_enrolled'] = true;
                            } elseif (in_array($value, ['false', '0', 'no', 'n', 'off', 'graduated'])) {
                                $row['is_currently_enrolled'] = false;
                            } else {
                                $row['is_currently_enrolled'] = (bool) $row['is_currently_enrolled'];
                            }
                        }

                        // Validate required fields
                        $rowValidator = Validator::make($row, [
                            'student_id_number' => 'required|string|max:50',
                            'first_name' => 'required|string|max:100',
                            'last_name' => 'required|string|max:100',
                            'enrollment_year' => 'required|string|max:20',
                            'enrollment_term' => 'required|string|max:50',
                            'is_currently_enrolled' => 'nullable|boolean',
                            'enrollment_date' => 'nullable|date',
                            'program' => 'nullable|string|max:200',
                            'year_level' => 'nullable|string|max:50'
                        ]);

                        if ($rowValidator->fails()) {
                            $errorMessage = "Row " . ($index + 1) . ": " . implode(', ', $rowValidator->errors()->all());
                            $errors[] = $errorMessage;
                            Log::warning('CSV validation failed', [
                                'row' => $index + 1,
                                'data' => $row,
                                'errors' => $rowValidator->errors()->all()
                            ]);
                            continue;
                        }

                        // Prepare data for insertion
                        $enrollmentData = [
                            'school_id' => $schoolId,
                            'student_id_number' => $row['student_id_number'],
                            'first_name' => $row['first_name'],
                            'last_name' => $row['last_name'],
                            'enrollment_year' => $row['enrollment_year'],
                            'enrollment_term' => $row['enrollment_term'],
                            'is_currently_enrolled' => $row['is_currently_enrolled'] ?? true,
                            'enrollment_date' => $row['enrollment_date'] ?? null,
                            'program' => $row['program'] ?? null,
                            'year_level' => $row['year_level'] ?? null,
                            'uploaded_by' => $authUser['citizen_id'],
                            'uploaded_at' => now()
                        ];

                        // Create or update Student record
                        $student = Student::firstOrCreate(
                            ['student_id_number' => $row['student_id_number']],
                            [
                                'first_name' => $row['first_name'],
                                'last_name' => $row['last_name'],
                                'middle_name' => null,
                                'email' => null,
                                'phone_number' => null,
                                'date_of_birth' => null,
                                'gender' => null,
                                'address' => null,
                                'city' => null,
                                'province' => null,
                                'zip_code' => null,
                                'is_active' => true
                            ]
                        );

                        // Update student name if it changed
                        if ($student->first_name !== $row['first_name'] || $student->last_name !== $row['last_name']) {
                            $student->update([
                                'first_name' => $row['first_name'],
                                'last_name' => $row['last_name']
                            ]);
                        }

                        // Use upsert to handle duplicates
                        $enrollment = PartnerSchoolEnrollmentData::upsertEnrollment($enrollmentData);
                        Log::info('Enrollment data created/updated', [
                            'enrollment_id' => $enrollment->id,
                            'student_id' => $row['student_id_number'],
                            'school_id' => $schoolId
                        ]);
                        $processed++;

                    } catch (\Exception $e) {
                        $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    }
                }

                DB::commit();

                Log::info('Enrollment data uploaded', [
                    'citizen_id' => $authUser['citizen_id'],
                    'school_id' => $schoolId,
                    'processed' => $processed,
                    'errors' => count($errors),
                    'update_mode' => $updateMode
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Enrollment data uploaded successfully.',
                    'data' => [
                        'processed' => $processed,
                        'errors' => $errors,
                        'warnings' => $warnings,
                        'school_id' => $schoolId,
                        'school_name' => $representative->school->name
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error uploading enrollment data', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload enrollment data.'
            ], 500);
        }
    }

    /**
     * Get enrollment data for the partner school
     */
    public function getEnrollmentData(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');
        
        // Verify this is a partner school representative
        if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Partner school representative role required.'
            ], 403);
        }

        if (!isset($authUser['citizen_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Citizen ID not found in authentication data.'
            ], 400);
        }

        try {
            // Look up the representative's school
            $representative = PartnerSchoolRepresentative::with('school')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assignment found for this representative.'
                ], 404);
            }

            $schoolId = $representative->school_id;

            // Get enrollment data for this school
            $query = PartnerSchoolEnrollmentData::where('school_id', $schoolId);

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id_number', 'like', "%{$search}%");
                });
            }

            // Apply status filter
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'currently_enrolled') {
                    $query->where('is_currently_enrolled', true);
                } elseif ($request->status === 'not_enrolled') {
                    $query->where('is_currently_enrolled', false);
                }
            }

            // Apply year filter
            if ($request->has('year') && $request->year) {
                $query->where('enrollment_year', $request->year);
            }

            // Apply term filter
            if ($request->has('term') && $request->term) {
                $query->where('enrollment_term', $request->term);
            }

            $enrollmentData = $query->orderBy('uploaded_at', 'desc')
                                  ->paginate($request->get('per_page', 15));

            Log::info('Enrollment data requested', [
                'citizen_id' => $authUser['citizen_id'],
                'school_id' => $schoolId,
                'total_records' => $enrollmentData->total()
            ]);

            return response()->json([
                'success' => true,
                'data' => $enrollmentData
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching enrollment data', [
                'citizen_id' => $authUser['citizen_id'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollment data.'
            ], 500);
        }
    }

    /**
     * Upload flexible CSV data (accepts any structure)
     */
    public function uploadFlexibleData(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || $authUser['role'] !== 'ps_rep') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access.'
                ], 403);
            }

            // Get school ID for the authenticated user
            $schoolRep = PartnerSchoolRepresentative::where('citizen_id', $authUser['citizen_id'])->first();
            if (!$schoolRep) {
                return response()->json([
                    'success' => false,
                    'message' => 'School not found for user.'
                ], 404);
            }

            $schoolId = $schoolRep->school_id;
            $csvData = $request->input('csv_data', []);
            $headers = $request->input('headers', []);
            $updateMode = $request->input('update_mode', 'merge');

            if (empty($csvData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No CSV data provided.'
                ], 400);
            }

            // Handle replace mode
            if ($updateMode === 'replace') {
                FlexibleStudentData::where('school_id', $schoolId)->delete();
            }

            $processed = 0;
            $errors = [];

            DB::beginTransaction();

            try {
                foreach ($csvData as $index => $row) {
                    try {
                        FlexibleStudentData::createFromCSVRow($row, (int)$schoolId, $authUser['citizen_id'], (array)$headers);
                        $processed++;
                    } catch (\Exception $e) {
                        $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Flexible data uploaded successfully.',
                    'processed' => $processed,
                    'errors' => $errors,
                    'total_received' => count($csvData)
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error uploading flexible data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload flexible data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get flexible students data
     */
    public function getFlexibleStudents(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || $authUser['role'] !== 'ps_rep') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access.'
                ], 403);
            }

            // Get school ID for the authenticated user
            $schoolRep = PartnerSchoolRepresentative::where('citizen_id', $authUser['citizen_id'])->first();
            if (!$schoolRep) {
                return response()->json([
                    'success' => false,
                    'message' => 'School not found for user.'
                ], 404);
            }

            $schoolId = $schoolRep->school_id;
            $perPage = $request->input('per_page', 1000); // Show up to 1000 records
            $page = $request->input('page', 1);

            $flexibleStudents = FlexibleStudentData::where('school_id', $schoolId)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $flexibleStudents
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching flexible students', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch flexible students.'
            ], 500);
        }
    }
}
