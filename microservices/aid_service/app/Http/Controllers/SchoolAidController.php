<?php

namespace App\Http\Controllers;

use App\Models\AidDisbursement;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\School;
use App\Models\ScholarshipCategory;
use App\Models\ScholarshipSubcategory;
use App\Models\BudgetAllocation;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SchoolAidController extends Controller
{
    public function getApplications(Request $request): JsonResponse
    {
        try {
            // Get applications with related data
            $query = ScholarshipApplication::with(['student', 'school', 'category', 'subcategory']);

            // Apply filters - prioritize status parameter over submodule
            $status = $request->get('status');
            if ($status && $status !== 'all') {
                // Use the explicit status parameter
                $query->where('status', $status);
            } else {
                // Default to approved applications if no specific status is requested
                $query->where('status', 'approved');
            }

            $priority = $request->get('priority');
            if ($priority && $priority !== 'all') {
                // Note: Priority might be stored differently in the actual database
                // This is a placeholder - adjust based on actual schema
                $query->where('priority', $priority);
            }

            $search = $request->get('search');
            if ($search) {
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('application_number', 'like', "%{$search}%");
            }

            $applications = $query->get();

            // Transform data to match frontend expectations
            $transformedApplications = $applications->map(function ($app) {
                return [
                    'id' => (string) $app->id,
                    'studentName' => $app->student ? $app->student->full_name : 'Unknown Student',
                    'studentId' => $app->application_number,
                    'school' => $app->school ? $app->school->name : 'Unknown School',
                    'schoolId' => (string) $app->school_id,
                    'amount' => $app->approved_amount ?? ($app->subcategory ? $app->subcategory->amount : ($app->category ? $app->category->amount : 0)),
                    'status' => $app->status,
                    'priority' => $this->determinePriority($app),
                    'submittedDate' => $app->created_at ? $app->created_at->format('Y-m-d') : '',
                    'approvalDate' => $app->updated_at ? $app->updated_at->format('Y-m-d') : '',
                    'digitalWallets' => $app->digital_wallets ?? [],
                    'walletAccountNumber' => $app->wallet_account_number ?? '',
                    'documents' => []
                ];
            });

            return response()->json($transformedApplications->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch applications',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateApplicationStatus(Request $request, $id): JsonResponse
    {
        try {
            $application = ScholarshipApplication::findOrFail($id);
            $oldStatus = $application->status;
            $application->status = $request->input('status');
            $application->save();

            AuditLogService::logApplicationStatusUpdate(
                (string) $application->id,
                (string) $oldStatus,
                (string) $application->status
            );

            return response()->json([
                'success' => true,
                'message' => 'Application status updated successfully',
                'application_id' => $id,
                'new_status' => $request->input('status')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update application status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function processGrant(Request $request, $id): JsonResponse
    {
        try {
            $application = ScholarshipApplication::findOrFail($id);

            // Check if application is approved
            if ($application->status !== 'approved') {
                return response()->json([
                    'error' => 'Application must be approved before processing grant',
                    'current_status' => $application->status
                ], 400);
            }

            // Update status to grants_processing
            $application->status = 'grants_processing';
            $application->save();

            $amount = $application->approved_amount ?? ($application->subcategory ? $application->subcategory->amount : ($application->category ? $application->category->amount : 0));

            AuditLogService::logGrantProcessingStarted(
                (string) $application->id,
                (float) $amount
            );

            // Here you can add additional logic for grant processing:
            // - Create disbursement records
            // - Send notifications
            // - Log the action
            // - Update related tables

            return response()->json([
                'success' => true,
                'message' => 'Grant processing initiated successfully',
                'application_id' => $id,
                'new_status' => 'grants_processing',
                'amount' => $application->approved_amount ?? 0
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to process grant',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function batchUpdateApplications(Request $request): JsonResponse
    {
        try {
            $applicationIds = $request->input('applicationIds', []);
            $status = $request->input('status');

            ScholarshipApplication::whereIn('id', $applicationIds)
                ->update(['status' => $status]);

            return response()->json([
                'success' => true,
                'message' => 'Applications updated successfully',
                'updated_count' => count($applicationIds)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to batch update applications',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function processDisbursement(Request $request, $id): JsonResponse
    {
        try {
            $application = ScholarshipApplication::findOrFail($id);

            // 1. Validate status
            if (!in_array($application->status, ['pending_disbursement', 'grants_processing'])) {
                return response()->json([
                    'error' => 'Application must be in pending_disbursement or grants_processing status',
                    'current_status' => $application->status
                ], 400);
            }

            // 2. Validate request
            $validated = $request->validate([
                'method' => 'required|string',
                'providerName' => 'required|string',
                'referenceNumber' => 'required|string',
                'receiptFile' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120', // 5MB max
                'notes' => 'nullable|string'
            ]);

            // 3. Prevent duplicate reference number check (optional but good practice)
            // This would require a separate PaymentRecord table check ideally

            // 4. Handle File Upload
            $file = $request->file('receiptFile');
            $filename = $validated['referenceNumber'] . '.' . $file->getClientOriginalExtension();
            // Store in 'public/receipts' disk
            $path = $file->storeAs('receipts', $filename, 'public');
            $validated['receipt_path'] = '/storage/' . $path;
            $amount = $application->approved_amount ?? ($application->subcategory ? $application->subcategory->amount : ($application->category ? $application->category->amount : 0));

            $disbursement = AidDisbursement::create([
                'application_id' => $application->id,
                'application_number' => $application->application_number,
                'student_id' => $application->student_id,
                'school_id' => $application->school_id,
                'amount' => $amount,
                'method' => $validated['method'],
                'provider_name' => $validated['providerName'],
                'reference_number' => $validated['referenceNumber'],
                'receipt_path' => $validated['receipt_path'],
                'notes' => $validated['notes'] ?? null,
                'disbursed_by_user_id' => $request->input('disbursedById'),
                'disbursed_by_name' => $request->input('disbursedByName'),
                'disbursed_at' => now(),
            ]);

            $application->status = 'grants_disbursed';
            if (!empty($validated['notes'])) {
                $application->notes = $validated['notes'];
            }
            $application->save();

            // Update budget allocation - decrement the appropriate budget
            // Get school year from application or use current school year
            $schoolYear = $this->getSchoolYearFromApplication($application);
            $this->updateBudgetOnDisbursement($application, $amount, $schoolYear);

            AuditLogService::logDisbursementCreated(
                $disbursement->toArray(),
                $application->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Disbursement processed successfully',
                'application' => $application,
                'disbursement' => $disbursement,
            ]);
            // Unreachable legacy block removed intentionally

            // 6. Log Action (Placeholder)
            // Log::info("Disbursement processed for App ID {$id} by User " . auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'Disbursement processed successfully',
                'data' => [
                    'application_id' => $application->id,
                    'status' => $application->status,
                    'proof_url' => $application->proof_of_transfer_url
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to process disbursement',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getDisbursementHistory(Request $request): JsonResponse
    {
        try {
            $query = AidDisbursement::query();

            $method = $request->get('method');
            if ($method) {
                $query->where('method', $method);
            }

            $reference = $request->get('reference');
            if ($reference) {
                $query->where('reference_number', 'like', '%' . $reference . '%');
            }

            $dateFrom = $request->get('date_from');
            if ($dateFrom) {
                $query->whereDate('disbursed_at', '>=', $dateFrom);
            }

            $dateTo = $request->get('date_to');
            if ($dateTo) {
                $query->whereDate('disbursed_at', '<=', $dateTo);
            }

            $allowedSortColumns = ['disbursed_at', 'amount', 'created_at'];
            $sortBy = $request->get('sortBy', 'disbursed_at');
            if (!in_array($sortBy, $allowedSortColumns, true)) {
                $sortBy = 'disbursed_at';
            }

            $sortDir = $request->get('sortDir', 'desc') === 'asc' ? 'asc' : 'desc';

            $disbursements = $query
                ->orderBy($sortBy, $sortDir)
                ->get();

            $search = $request->get('search');

            $records = $disbursements->map(function (AidDisbursement $disbursement) {
                $application = ScholarshipApplication::with(['student', 'school'])
                    ->find($disbursement->application_id);

                $studentName = $application && $application->student
                    ? $application->student->full_name
                    : null;

                $schoolName = $application && $application->school
                    ? $application->school->name
                    : null;

                return [
                    'id' => (string) $disbursement->id,
                    'applicationId' => (string) $disbursement->application_id,
                    'applicationNumber' => $disbursement->application_number,
                    'studentName' => $studentName,
                    'schoolName' => $schoolName,
                    'amount' => (float) $disbursement->amount,
                    'method' => $disbursement->method,
                    'providerName' => $disbursement->provider_name,
                    'referenceNumber' => $disbursement->reference_number,
                    'receiptPath' => $disbursement->receipt_path,
                    'notes' => $disbursement->notes,
                    'disbursedByUserId' => $disbursement->disbursed_by_user_id
                        ? (string) $disbursement->disbursed_by_user_id
                        : null,
                    'disbursedByName' => $disbursement->disbursed_by_name,
                    'disbursedAt' => $disbursement->disbursed_at instanceof \DateTimeInterface
                        ? $disbursement->disbursed_at->format(DATE_ATOM)
                        : ($disbursement->disbursed_at ? (string) $disbursement->disbursed_at : null),
                ];
            });

            if ($search) {
                $searchLower = mb_strtolower($search);
                $records = $records->filter(function (array $row) use ($searchLower) {
                    $fields = [
                        $row['studentName'] ?? '',
                        $row['schoolName'] ?? '',
                        $row['applicationNumber'] ?? '',
                        $row['referenceNumber'] ?? '',
                        $row['providerName'] ?? '',
                        $row['disbursedByName'] ?? '',
                    ];

                    foreach ($fields as $field) {
                        if ($field !== '' && mb_stripos($field, $searchLower) !== false) {
                            return true;
                        }
                    }

                    return false;
                })->values();
            }

            return response()->json($records->toArray());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch disbursement history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function viewDisbursementReceipt($id)
    {
        $disbursement = AidDisbursement::findOrFail($id);

        if (!$disbursement->receipt_path) {
            abort(404);
        }

        $receiptPath = $disbursement->receipt_path;
        $prefix = '/storage/';

        if (strpos($receiptPath, $prefix) === 0) {
            $relativePath = substr($receiptPath, strlen($prefix));
        } else {
            $relativePath = ltrim($receiptPath, '/');
        }

        if (!Storage::disk('public')->exists($relativePath)) {
            abort(404);
        }

        $absolutePath = Storage::disk('public')->path($relativePath);
        $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
        ]);
    }

    public function getMetrics(Request $request): JsonResponse
    {
        try {
            // Get school year from request or use current school year
            $schoolYear = $request->get('school_year');
            if (!$schoolYear) {
                $currentYear = date('Y');
                $nextYear = date('Y') + 1;
                $schoolYear = "{$currentYear}-{$nextYear}";
            }

            // Accounts needing processing (approved but not yet processing)
            $needProcessing = ScholarshipApplication::where('status', 'approved')->count();

            // Accounts needing disbursing (currently in grants_processing)
            $needDisbursing = ScholarshipApplication::where('status', 'grants_processing')->count();

            // Total disbursed applications
            $disbursedCount = ScholarshipApplication::where('status', 'grants_disbursed')->count();

            // Total amount disbursed
            $totalDisbursedAmount = AidDisbursement::sum('amount');

            // Get budget allocations from database (handle case where table doesn't exist yet)
            $financialSupportBudget = null;
            $scholarshipBenefitsBudget = null;
            
            try {
                if (DB::getSchemaBuilder()->hasTable('budget_allocations')) {
                    $financialSupportBudget = BudgetAllocation::where('budget_type', 'financial_support')
                        ->where('school_year', $schoolYear)
                        ->where('is_active', true)
                        ->first();
                    $scholarshipBenefitsBudget = BudgetAllocation::where('budget_type', 'scholarship_benefits')
                        ->where('school_year', $schoolYear)
                        ->where('is_active', true)
                        ->first();
                }
            } catch (\Exception $e) {
                // Table doesn't exist or other error - use calculated values
                \Log::warning('Budget allocations table not available: ' . $e->getMessage());
            }

            // Calculate budgets for each type based on applications (fallback if not set in DB)
            $financialSupportTotal = $this->calculateBudgetByType('financial_support');
            $scholarshipBenefitsTotal = $this->calculateBudgetByType('scholarship_benefits');

            // Get disbursed amounts by type (use database value if available, otherwise calculate)
            $financialSupportDisbursed = $financialSupportBudget && $financialSupportBudget->disbursed_budget > 0 
                ? $financialSupportBudget->disbursed_budget 
                : $this->calculateDisbursedByType('financial_support');
            $scholarshipBenefitsDisbursed = $scholarshipBenefitsBudget && $scholarshipBenefitsBudget->disbursed_budget > 0
                ? $scholarshipBenefitsBudget->disbursed_budget
                : $this->calculateDisbursedByType('scholarship_benefits');

            // Use database budget allocations if set (> 0), otherwise use calculated values
            $financialSupportBudgetTotal = ($financialSupportBudget && $financialSupportBudget->total_budget > 0) 
                ? $financialSupportBudget->total_budget 
                : $financialSupportTotal;
            $scholarshipBenefitsBudgetTotal = ($scholarshipBenefitsBudget && $scholarshipBenefitsBudget->total_budget > 0)
                ? $scholarshipBenefitsBudget->total_budget
                : $scholarshipBenefitsTotal;

            // Calculate remaining budgets
            $financialSupportRemaining = max(0, $financialSupportBudgetTotal - $financialSupportDisbursed);
            $scholarshipBenefitsRemaining = max(0, $scholarshipBenefitsBudgetTotal - $scholarshipBenefitsDisbursed);

            // Total budget (sum of both types)
            $totalBudget = $financialSupportBudgetTotal + $scholarshipBenefitsBudgetTotal;
            $totalRemaining = $financialSupportRemaining + $scholarshipBenefitsRemaining;

            return response()->json([
                'need_processing' => $needProcessing,
                'need_disbursing' => $needDisbursing,
                'disbursed_count' => $disbursedCount,
                'total_disbursed' => $totalDisbursedAmount,
                'total_budget' => $totalBudget,
                'remaining_budget' => $totalRemaining,
                'utilization_rate' => $totalBudget > 0 ? round(($totalDisbursedAmount / $totalBudget) * 100, 1) : 0,
                'budgets' => [
                    'financial_support' => [
                        'total_budget' => $financialSupportBudgetTotal,
                        'disbursed' => $financialSupportDisbursed,
                        'remaining' => $financialSupportRemaining,
                        'utilization_rate' => $financialSupportBudgetTotal > 0 ? round(($financialSupportDisbursed / $financialSupportBudgetTotal) * 100, 1) : 0,
                    ],
                    'scholarship_benefits' => [
                        'total_budget' => $scholarshipBenefitsBudgetTotal,
                        'disbursed' => $scholarshipBenefitsDisbursed,
                        'remaining' => $scholarshipBenefitsRemaining,
                        'utilization_rate' => $scholarshipBenefitsBudgetTotal > 0 ? round(($scholarshipBenefitsDisbursed / $scholarshipBenefitsBudgetTotal) * 100, 1) : 0,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch metrics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function determinePriority($application): string
    {
        // Determine priority based on application data
        // This is a placeholder - adjust based on actual business logic
        $amount = $application->approved_amount ?? ($application->subcategory ? $application->subcategory->amount : ($application->category ? $application->category->amount : 0));

        if ($amount >= 20000) {
            return 'high';
        } elseif ($amount >= 15000) {
            return 'normal';
        } else {
            return 'low';
        }
    }

    /**
     * Determine budget type based on application's category/subcategory type
     */
    private function getBudgetType($application): string
    {
        // Check subcategory type first, then category type
        $type = null;
        
        if ($application->subcategory_id) {
            $subcategory = ScholarshipSubcategory::find($application->subcategory_id);
            if ($subcategory) {
                // Access type directly from database
                $type = DB::connection('scholarship_service')
                    ->table('scholarship_subcategories')
                    ->where('id', $application->subcategory_id)
                    ->value('type');
            }
        }
        
        if (!$type && $application->category_id) {
            $type = DB::connection('scholarship_service')
                ->table('scholarship_categories')
                ->where('id', $application->category_id)
                ->value('type');
        }

        // Financial support = need_based, Scholarship benefits = merit/special/renewal
        return ($type === 'need_based') ? 'financial_support' : 'scholarship_benefits';
    }

    /**
     * Calculate total budget for a specific type based on approved applications
     */
    private function calculateBudgetByType(string $budgetType): float
    {
        $applications = ScholarshipApplication::whereIn('status', ['approved', 'grants_processing', 'grants_disbursed'])
            ->with(['subcategory', 'category'])
            ->get();

        $total = 0;
        foreach ($applications as $app) {
            $appBudgetType = $this->getBudgetType($app);
            if ($appBudgetType === $budgetType) {
                $amount = $app->approved_amount ?? ($app->subcategory ? $app->subcategory->amount : ($app->category ? $app->category->amount : 0));
                $total += $amount;
            }
        }

        return $total;
    }

    /**
     * Calculate disbursed amount for a specific budget type
     */
    private function calculateDisbursedByType(string $budgetType): float
    {
        $disbursements = AidDisbursement::all();

        $total = 0;
        foreach ($disbursements as $disbursement) {
            $application = ScholarshipApplication::find($disbursement->application_id);
            if ($application) {
                $appBudgetType = $this->getBudgetType($application);
                if ($appBudgetType === $budgetType) {
                    $total += $disbursement->amount;
                }
            }
        }

        return $total;
    }

    /**
     * Get school year from application or return current school year
     */
    private function getSchoolYearFromApplication($application): string
    {
        // Try to get school year from application's academic record
        try {
            if ($application->student_id) {
                $academicRecord = DB::connection('scholarship_service')
                    ->table('academic_records')
                    ->where('student_id', $application->student_id)
                    ->where('is_current', true)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                if ($academicRecord && isset($academicRecord->school_year)) {
                    return $academicRecord->school_year;
                }
            }
        } catch (\Exception $e) {
            // Fall through to default
        }
        
        // Default to current school year
        $currentYear = date('Y');
        $nextYear = date('Y') + 1;
        return "{$currentYear}-{$nextYear}";
    }

    /**
     * Update budget allocation when disbursement is processed
     */
    private function updateBudgetOnDisbursement($application, float $amount, string $schoolYear): void
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('budget_allocations')) {
                // Table doesn't exist yet - skip budget update
                return;
            }
            
            $budgetType = $this->getBudgetType($application);
            
            $budgetAllocation = BudgetAllocation::where('budget_type', $budgetType)
                ->where('school_year', $schoolYear)
                ->where('is_active', true)
                ->first();
            
            if ($budgetAllocation) {
                $budgetAllocation->incrementDisbursed($amount);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the disbursement
            \Log::warning('Failed to update budget allocation: ' . $e->getMessage());
        }
    }
}
