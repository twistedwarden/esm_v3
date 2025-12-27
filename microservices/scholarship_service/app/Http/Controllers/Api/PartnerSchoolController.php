<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\School;
use App\Models\Student;
use App\Models\ScholarshipApplication;
use App\Services\SchoolSpecificTableService;
use App\Services\UnifiedSchoolDataService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class PartnerSchoolController extends Controller
{
    protected $schoolTableService;
    protected $unifiedService;

    public function __construct(SchoolSpecificTableService $schoolTableService, UnifiedSchoolDataService $unifiedService)
    {
        $this->schoolTableService = $schoolTableService;
        $this->unifiedService = $unifiedService;
    }

    /**
     * Get user data from auth service
     */
    private function getUserFromAuthService(Request $request)
    {
        $token = $request->bearerToken();
        
        if (!$token) {
            return null;
        }

        try {
            $authServiceUrl = env('AUTH_SERVICE_URL', 'http://localhost:8000');
            
            $response = Http::timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json',
                ])
                ->get("{$authServiceUrl}/api/user");

            if ($response->successful()) {
                $data = $response->json();
                return $data['success'] ? $data['data']['user'] : null;
            }
        } catch (\Exception $e) {
            \Log::error('Failed to get user from auth service: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Get statistics for the partner school
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            // Get the current user's assigned school from auth service
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $school = School::find($user['assigned_school_id']);
            
            if (!$school) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assigned school not found'
                ], 404);
            }

            // Get basic statistics
            $schoolId = $school->id;
            
            // Get students through academic_records table
            $totalStudents = Student::whereHas('academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->count();
            
            $activeStudents = Student::whereHas('academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->where('is_currently_enrolled', true)->count();
            
            $totalApplications = ScholarshipApplication::whereHas('student.academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->count();
            
            $pendingApplications = ScholarshipApplication::whereHas('student.academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->where('status', 'pending')->count();
            
            $approvedApplications = ScholarshipApplication::whereHas('student.academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->where('status', 'approved')->count();
            
            $rejectedApplications = ScholarshipApplication::whereHas('student.academicRecords', function($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->where('status', 'rejected')->count();

            $stats = [
                'school' => [
                    'id' => $school->id,
                    'name' => $school->name,
                    'campus' => $school->campus,
                    'classification' => $school->classification,
                    'is_partner_school' => $school->is_partner_school,
                ],
                'students' => [
                    'total' => $totalStudents,
                    'active' => $activeStudents,
                    'inactive' => $totalStudents - $activeStudents,
                ],
                'applications' => [
                    'total' => $totalApplications,
                    'pending' => $pendingApplications,
                    'approved' => $approvedApplications,
                    'rejected' => $rejectedApplications,
                ],
                'recent_activity' => [
                    'new_students_this_month' => Student::whereHas('academicRecords', function($query) use ($schoolId) {
                        $query->where('school_id', $schoolId);
                    })->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                    'new_applications_this_month' => ScholarshipApplication::whereHas('student.academicRecords', function($query) use ($schoolId) {
                        $query->where('school_id', $schoolId);
                    })->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            \Log::error('PartnerSchool getStats error: ' . $e->getMessage());
            \Log::error('PartnerSchool getStats error trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partner school statistics: ' . $e->getMessage(),
                'debug' => [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Get students for the partner school
     */
    public function getStudents(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $perPage = $request->get('per_page', 100);
            $search = $request->get('search');
            $schoolId = $user['assigned_school_id'];
            
            // Get students through academic_records table
            $query = Student::whereHas('academicRecords', function($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
            
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id_number', 'like', "%{$search}%")
                      ->orWhere('email_address', 'like', "%{$search}%");
                });
            }
            
            $students = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Get enrollment data for the partner school
     */
    public function getEnrollmentData(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $schoolId = $user['assigned_school_id'];
            $perPage = $request->get('per_page', 100);
            $search = $request->get('search');
            $status = $request->get('status', 'all');
            
            \Log::info('Fetching enrollment data from school-specific table', [
                'school_id' => $schoolId,
                'per_page' => $perPage,
                'search' => $search,
                'status' => $status
            ]);

            // Get data from unified table (with fallback to school-specific tables)
            $students = $this->unifiedService->getSchoolStudentData($schoolId, [
                'per_page' => $perPage,
                'search' => $search,
                'status' => $status
            ]);

            // Transform the data to match the expected format
            $transformedStudents = $students->getCollection()->map(function($student) {
                try {
                    \Log::info("Processing student from school table: {$student->student_id_number} - {$student->first_name} {$student->last_name}");
                    
                    // Create enrollment data array (single record since it's all in one table now)
                    $enrollmentData = [[
                        'id' => $student->id,
                        'school_id' => $schoolId ?? null,
                        'educational_level' => $student->educational_level,
                        'program' => $student->program,
                        'major' => $student->major,
                        'year_level' => $student->year_level,
                        'school_year' => $student->school_year,
                        'school_term' => $student->school_term,
                        'units_enrolled' => $student->units_enrolled,
                        'gpa' => $student->gpa,
                        'is_current' => true,
                        'is_graduating' => $student->is_graduating,
                        'enrollment_date' => $student->enrollment_date,
                        'graduation_date' => $student->graduation_date,
                        'is_currently_enrolled' => $student->is_currently_enrolled,
                        'created_at' => $student->created_at,
                        'updated_at' => $student->updated_at,
                    ]];

                    return [
                        'id' => $student->id,
                        'citizen_id' => $student->citizen_id,
                        'student_id_number' => $student->student_id_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'middle_name' => $student->middle_name,
                        'extension_name' => $student->extension_name,
                        'full_name' => $student->first_name . ' ' . $student->last_name,
                        'sex' => $student->sex,
                        'civil_status' => $student->civil_status,
                        'nationality' => $student->nationality,
                        'birth_place' => $student->birth_place,
                        'birth_date' => $student->birth_date,
                        'contact_number' => $student->contact_number,
                        'email_address' => $student->email_address,
                        'is_currently_enrolled' => $student->is_currently_enrolled,
                        'is_graduating' => $student->is_graduating,
                        'enrollmentData' => $enrollmentData,
                        'academicRecords' => $enrollmentData, // Same data for compatibility
                        'upload_batch_id' => $student->upload_batch_id,
                        'original_filename' => $student->original_filename,
                        'uploaded_at' => $student->uploaded_at,
                        'created_at' => $student->created_at,
                        'updated_at' => $student->updated_at,
                    ];
                } catch (\Exception $e) {
                    \Log::error("Error processing student {$student->id}: " . $e->getMessage());
                    return [
                        'id' => $student->id,
                        'citizen_id' => $student->citizen_id,
                        'student_id_number' => $student->student_id_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'middle_name' => $student->middle_name,
                        'extension_name' => $student->extension_name,
                        'full_name' => $student->first_name . ' ' . $student->last_name,
                        'sex' => $student->sex,
                        'civil_status' => $student->civil_status,
                        'nationality' => $student->nationality,
                        'birth_place' => $student->birth_place,
                        'birth_date' => $student->birth_date,
                        'contact_number' => $student->contact_number,
                        'email_address' => $student->email_address,
                        'is_currently_enrolled' => $student->is_currently_enrolled,
                        'is_graduating' => $student->is_graduating,
                        'enrollmentData' => [],
                        'academicRecords' => [],
                        'created_at' => $student->created_at,
                        'updated_at' => $student->updated_at,
                    ];
                }
            });

            return response()->json([
                'success' => true,
                'data' => $transformedStudents
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool getEnrollmentData error: ' . $e->getMessage());
            \Log::error('PartnerSchool getEnrollmentData error trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollment data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload enrollment data for the partner school
     */
    public function uploadEnrollmentData(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $validated = $request->validate([
                'csv_data' => 'required|array',
                'update_mode' => 'required|in:merge,replace'
            ]);

            $schoolId = $user['assigned_school_id'];
            $csvData = $validated['csv_data'];
            $updateMode = $validated['update_mode'];
            
            // Generate a unique batch ID for this upload
            $batchId = \Str::uuid();
            $filename = $request->input('filename', 'uploaded_file.csv');
            
            $processedCount = 0;
            $errors = [];

            \Log::info('Starting CSV upload processing to school-specific table', [
                'school_id' => $schoolId,
                'total_rows' => count($csvData),
                'batch_id' => $batchId,
                'filename' => $filename
            ]);

            // Ensure school-specific table exists (for backward compatibility)
            $this->schoolTableService->ensureSchoolTableExists($schoolId, 'School ' . $schoolId);

            foreach ($csvData as $index => $row) {
                try {
                    \Log::info("Processing row {$index} for school {$schoolId}", ['row' => $row]);
                    
                    // Prepare data for unified table - CAPTURE ALL FIELDS AS-IS
                    $studentData = [
                        'student_id_number' => $row['student_id_number'] ?? $row['citizen_id'] ?? $row['student_id'] ?? 'STU-' . time() . '-' . $index,
                        'first_name' => $row['first_name'] ?? 'Unknown',
                        'last_name' => $row['last_name'] ?? 'Unknown',
                        'middle_name' => $row['middle_name'] ?? null,
                        'extension_name' => $row['extension_name'] ?? null,
                        'citizen_id' => $row['citizen_id'] ?? $row['student_id'] ?? $row['student_id_number'] ?? null,
                        'sex' => $row['sex'] ?? 'Male',
                        'civil_status' => $row['civil_status'] ?? 'Single',
                        'nationality' => $row['nationality'] ?? 'Filipino',
                        'birth_place' => $row['birth_place'] ?? null,
                        'birth_date' => $row['birth_date'] ?? null,
                        'contact_number' => $row['contact_number'] ?? null,
                        'email_address' => $row['email_address'] ?? null,
                        'is_currently_enrolled' => 'enrolled', // ALWAYS set to "enrolled" regardless of input
                        'is_graduating' => $row['is_graduating'] ?? false,
                        'educational_level' => $row['educational_level'] ?? 'TERTIARY/COLLEGE',
                        'program' => $row['program'] ?? null,
                        'major' => $row['major'] ?? null,
                        'year_level' => $row['year_level'] ?? '1st Year',
                        'school_year' => $row['school_year'] ?? date('Y') . '-' . (date('Y') + 1),
                        'school_term' => $row['school_term'] ?? '1st Semester',
                        'units_enrolled' => $row['units_enrolled'] ?? null,
                        'gpa' => $row['gpa'] ?? null,
                        'enrollment_date' => $row['enrollment_date'] ?? now()->toDateString(),
                        'graduation_date' => $row['graduation_date'] ?? null,
                    ];
                    
                    // Add ALL other fields from the CSV as-is (capture everything)
                    foreach ($row as $key => $value) {
                        // Skip fields we've already processed above
                        $processedFields = [
                            'student_id_number', 'first_name', 'last_name', 'middle_name', 'extension_name',
                            'citizen_id', 'sex', 'civil_status', 'nationality', 'birth_place', 'birth_date',
                            'contact_number', 'email_address', 'is_currently_enrolled', 'is_graduating',
                            'educational_level', 'program', 'major', 'year_level', 'school_year', 'school_term',
                            'units_enrolled', 'gpa', 'enrollment_date', 'graduation_date'
                        ];
                        
                        if (!in_array($key, $processedFields) && !empty($value)) {
                            // Store additional fields as-is
                            $studentData['additional_data'] = $studentData['additional_data'] ?? [];
                            $studentData['additional_data'][$key] = $value;
                        }
                    }
                    
                    // Insert into unified table (with fallback to school-specific tables)
                    $this->unifiedService->insertStudentData($schoolId, $studentData, $batchId, $filename);

                    $processedCount++;
                    \Log::info("Successfully processed student {$studentData['student_id_number']} for school {$schoolId}");
                } catch (\Exception $e) {
                    $errors[] = "Row {$index} error: " . $e->getMessage();
                    \Log::error("Error processing row {$index} for school {$schoolId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully processed {$processedCount} students for school {$schoolId}",
                'data' => [
                    'processed_count' => $processedCount,
                    'total_rows' => count($csvData),
                    'school_id' => $schoolId,
                    'batch_id' => $batchId,
                    'filename' => $filename,
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool uploadEnrollmentData error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload enrollment data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get school data statistics
     */
    public function getSchoolStats(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $schoolId = $user['assigned_school_id'];
            $stats = $this->unifiedService->getSchoolStatistics($schoolId);
            $uploadBatches = $this->unifiedService->getUploadBatches($schoolId);

            return response()->json([
                'success' => true,
                'data' => [
                    'statistics' => $stats,
                    'upload_batches' => $uploadBatches
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool getSchoolStats error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch school statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an upload batch
     */
    public function deleteUploadBatch(Request $request, string $batchId): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $schoolId = $user['assigned_school_id'];
            $deletedCount = $this->unifiedService->deleteUploadBatch($schoolId, $batchId);

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} records from batch {$batchId}",
                'data' => [
                    'deleted_count' => $deletedCount,
                    'batch_id' => $batchId
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool deleteUploadBatch error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete upload batch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload flexible data for the partner school
     */
    public function uploadFlexibleData(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $validated = $request->validate([
                'csv_data' => 'required|array',
                'headers' => 'required|array',
                'update_mode' => 'required|in:merge,replace'
            ]);

            $schoolId = $user['assigned_school_id'];
            $csvData = $validated['csv_data'];
            $headers = $validated['headers'];
            $updateMode = $validated['update_mode'];
            
            $processedCount = 0;
            $errors = [];

            foreach ($csvData as $row) {
                try {
                    // Store flexible data
                    \DB::table('flexible_student_data')->insert([
                        'school_id' => $schoolId,
                        'data' => json_encode($row),
                        'headers' => json_encode($headers),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $processedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Row error: " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully processed {$processedCount} flexible data records",
                'data' => [
                    'processed_count' => $processedCount,
                    'total_rows' => count($csvData),
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool uploadFlexibleData error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload flexible data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get flexible students for the partner school
     */
    public function getFlexibleStudents(Request $request): JsonResponse
    {
        try {
            $user = $this->getUserFromAuthService($request);
            
            if (!$user || !isset($user['assigned_school_id']) || !$user['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }

            $schoolId = $user['assigned_school_id'];
            $perPage = $request->get('per_page', 100);
            $search = $request->get('search');
            
            $query = \DB::table('flexible_student_data')
                ->where('school_id', $schoolId);
            
            if ($search) {
                $query->where('data', 'like', "%{$search}%");
            }
            
            $total = $query->count();
            $flexibleData = $query->paginate($perPage);
            
            // Parse the JSON data for each record
            $parsedData = $flexibleData->map(function($record) {
                $record->data = json_decode($record->data, true);
                $record->headers = json_decode($record->headers, true);
                return $record;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $parsedData,
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $flexibleData->currentPage(),
                    'last_page' => $flexibleData->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('PartnerSchool getFlexibleStudents error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch flexible students: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student population data for all schools
     */
    public function getStudentPopulation(Request $request)
    {
        try {
            $schoolId = $request->query('school_id');
            $search = $request->query('search');
            
            // Get all schools
            $query = \App\Models\School::query();
            
            if ($schoolId && $schoolId !== 'all') {
                $query->where('id', $schoolId);
            }
            
            if ($search) {
                $query->where('name', 'like', '%' . $search . '%');
            }
            
            $schools = $query->get();
            
            $populationData = $schools->map(function ($school) {
                // Get students from unified table
                $studentsQuery = \App\Models\UnifiedSchoolStudentData::where('school_id', $school->id);
                $students = $studentsQuery->get();
                
                $totalStudents = $students->count();
                
                // Count by gender
                $maleStudents = $students->where('sex', 'Male')->count();
                $femaleStudents = $students->where('sex', 'Female')->count();
                
                // Get scholarship data from scholarship applications
                $scholarshipApplications = \App\Models\ScholarshipApplication::where('school_id', $school->id)
                    ->where('status', 'approved')
                    ->get();
                
                $scholarshipRecipients = $scholarshipApplications->count();
                $activeScholars = $scholarshipApplications->where('status', 'approved')->count();
                $graduatedScholars = $scholarshipApplications->where('status', 'completed')->count();
                
                $scholarshipRate = $totalStudents > 0 ? round(($scholarshipRecipients / $totalStudents) * 100, 1) : 0;
                
                return [
                    'id' => $school->id,
                    'school_name' => $school->name,
                    'total_students' => $totalStudents,
                    'male_students' => $maleStudents,
                    'female_students' => $femaleStudents,
                    'scholarship_recipients' => $scholarshipRecipients,
                    'active_scholars' => $activeScholars,
                    'graduated_scholars' => $graduatedScholars,
                    'scholarship_rate' => $scholarshipRate,
                    'last_updated' => $school->updated_at->toISOString(),
                    'population_date' => $school->updated_at->toISOString(),
                    'pending_applications' => \App\Models\ScholarshipApplication::where('school_id', $school->id)
                        ->where('status', 'submitted')
                        ->count(),
                    'scholarship_breakdown' => [
                        'merit' => $scholarshipApplications->where('category_id', 1)->count(),
                        'need_based' => $scholarshipApplications->where('category_id', 2)->count(),
                        'athletic' => $scholarshipApplications->where('category_id', 3)->count(),
                    ]
                ];
            });
            
            // Calculate totals
            $totals = [
                'total_students' => $populationData->sum('total_students'),
                'total_scholars' => $populationData->sum('scholarship_recipients'),
                'active_scholars' => $populationData->sum('active_scholars'),
                'graduated_scholars' => $populationData->sum('graduated_scholars'),
                'scholarship_rate' => $populationData->sum('total_students') > 0 
                    ? round(($populationData->sum('scholarship_recipients') / $populationData->sum('total_students')) * 100, 1) 
                    : 0
            ];
            
            return response()->json([
                'success' => true,
                'data' => $populationData,
                'totals' => $totals,
                'message' => 'Student population data retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('PartnerSchool getStudentPopulation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student population data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all schools for filtering
     */
    public function getSchools(Request $request)
    {
        try {
            $schools = \App\Models\School::select('id', 'name')
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $schools,
                'message' => 'Schools retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('PartnerSchool getSchools error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch schools: ' . $e->getMessage()
            ], 500);
        }
    }

}
