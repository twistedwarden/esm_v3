<?php

namespace App\Http\Controllers;

use App\Models\AidDisbursement;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\School;
use App\Models\ScholarshipCategory;
use App\Models\ScholarshipSubcategory;
use App\Models\BudgetAllocation;
use App\Models\PaymentTransaction;
use App\Services\AuditLogService;
use App\Services\PaymentService;
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
                // Get school year from student's current academic record
                $schoolYear = null;
                if ($app->student_id) {
                    try {
                        $academicRecord = DB::table('academic_records')
                            ->where('student_id', $app->student_id)
                            ->where('is_current', true)
                            ->orderBy('created_at', 'desc')
                            ->first();

                        if ($academicRecord && isset($academicRecord->school_year)) {
                            $schoolYear = $academicRecord->school_year;
                        }
                    } catch (\Exception $e) {
                        // Fall through to default
                    }
                }

                // Default to current school year if not found
                if (!$schoolYear) {
                    $currentYear = date('Y');
                    $nextYear = date('Y') + 1;
                    $schoolYear = "{$currentYear}-{$nextYear}";
                }

                // Extract payment method from digital_wallets
                $digitalWallets = $app->digital_wallets ?? [];
                $paymentMethod = null;
                if (is_array($digitalWallets) && count($digitalWallets) > 0) {
                    $paymentMethod = $digitalWallets[0];
                } elseif (is_string($digitalWallets)) {
                    // In case it's stored as JSON string
                    $decoded = json_decode($digitalWallets, true);
                    if (is_array($decoded) && count($decoded) > 0) {
                        $paymentMethod = $decoded[0];
                    } else {
                        $paymentMethod = $digitalWallets;
                    }
                }

                return [
                    'id' => (string) $app->id,
                    'studentName' => $app->student ? $app->student->full_name : 'Unknown Student',
                    'studentId' => $app->application_number,
                    'school' => $app->school ? $app->school->name : 'Unknown School',
                    'schoolId' => (string) $app->school_id,
                    'amount' => $app->approved_amount ?? ($app->subcategory ? $app->subcategory->amount : ($app->category ? $app->category->amount : 0)),
                    'status' => $app->status,
                    'submittedDate' => $app->created_at ? $app->created_at->format('Y-m-d') : '',
                    'approvalDate' => $app->updated_at ? $app->updated_at->format('Y-m-d') : '',
                    'schoolYear' => $schoolYear,
                    'paymentMethod' => $paymentMethod,
                    'digitalWallets' => $digitalWallets,
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

            $amount = $application->approved_amount ?? ($application->subcategory ? $application->subcategory->amount : ($application->category ? $application->category->amount : 0));

            // Create payment link via PaymentService
            $paymentService = new PaymentService();
            $paymentLink = $paymentService->createPaymentLink($application);

            // Create payment transaction record
            $paymentTransaction = PaymentTransaction::create([
                'application_id' => $application->id,
                'application_number' => $application->application_number,
                'student_id' => $application->student_id,
                'transaction_reference' => 'TXN-' . uniqid(),
                'payment_provider' => 'paymongo',
                'payment_method' => 'digital_wallet',
                'transaction_amount' => $amount,
                'transaction_status' => 'pending',
                'payment_link_url' => $paymentLink['checkout_url'],
                'provider_transaction_id' => $paymentLink['payment_id'],
                'initiated_at' => now(),
                'initiated_by_user_id' => $request->input('user_id'),
                'initiated_by_name' => $request->input('user_name'),
            ]);

            // Update application status
            $application->status = 'grants_processing';
            $application->save();

            AuditLogService::logAction(
                'payment_initiated',
                "Payment link created for application #{$application->application_number}",
                'scholarship_application',
                (string) $application->id,
                null,
                [
                    'payment_transaction_id' => $paymentTransaction->id,
                    'payment_url' => $paymentLink['checkout_url'],
                    'amount' => $amount,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment link created successfully',
                'payment_url' => $paymentLink['checkout_url'],
                'payment_transaction_id' => $paymentTransaction->id,
                'redirect' => true,
                'application_id' => $id,
                'new_status' => 'grants_processing',
                'amount' => $amount
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to process grant', [
                'error' => $e->getMessage(),
                'application_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to process grant',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function revertApplicationOnCancel(Request $request): JsonResponse
    {
        try {
            $applicationId = $request->input('application_id');
            $checkoutSessionId = $request->input('checkout_session_id');
            $transactionId = $request->input('transaction_id');

            $application = null;

            // Try to find application by ID first
            if ($applicationId) {
                $application = ScholarshipApplication::find($applicationId);
            }

            // If not found and we have checkout_session_id, find via payment transaction
            if (!$application && $checkoutSessionId) {
                $transaction = PaymentTransaction::where('provider_transaction_id', $checkoutSessionId)
                    ->orWhere('transaction_reference', $checkoutSessionId)
                    ->first();

                if ($transaction && $transaction->application_id) {
                    $application = ScholarshipApplication::find($transaction->application_id);
                }
            }

            // If still not found and we have transaction_id, find via payment transaction
            if (!$application && $transactionId) {
                $transaction = PaymentTransaction::find($transactionId);
                if ($transaction && $transaction->application_id) {
                    $application = ScholarshipApplication::find($transaction->application_id);
                }
            }

            if (!$application) {
                return response()->json([
                    'error' => 'Application not found',
                    'message' => 'Could not find application with provided parameters'
                ], 404);
            }

            // Only revert if status is grants_processing
            if ($application->status !== 'grants_processing') {
                return response()->json([
                    'success' => true,
                    'message' => 'Application status is not in processing state, no reversion needed',
                    'application_id' => $application->id,
                    'current_status' => $application->status
                ]);
            }

            $oldStatus = $application->status;
            $application->status = 'approved';
            $application->save();

            // Log audit
            AuditLogService::logAction(
                'payment_cancelled',
                "Payment cancelled for application #{$application->application_number}. Status reverted from {$oldStatus} to approved.",
                'scholarship_application',
                (string) $application->id,
                null,
                [
                    'previous_status' => $oldStatus,
                    'new_status' => 'approved',
                    'reason' => 'Payment cancelled by user'
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Application status reverted to approved',
                'application_id' => $application->id,
                'previous_status' => $oldStatus,
                'new_status' => 'approved'
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to revert application status on cancel', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to revert application status',
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

    /**
     * Process payment for an application (manual payment processing)
     * Creates payment transaction, disbursement record, and updates application status
     */
    public function processPayment(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // The frontend sends 'payment_id' which is actually the application ID
            $applicationId = $request->input('payment_id');

            if (!$applicationId) {
                return response()->json([
                    'error' => 'Application ID is required',
                ], 400);
            }

            // Find the application
            $application = ScholarshipApplication::findOrFail($applicationId);

            // Validate application status
            if (!in_array($application->status, ['approved', 'grants_processing'])) {
                return response()->json([
                    'error' => 'Application must be in approved or grants_processing status',
                    'current_status' => $application->status
                ], 400);
            }

            // Get the amount to disburse
            $amount = $application->approved_amount ??
                ($application->subcategory ? $application->subcategory->amount :
                    ($application->category ? $application->category->amount : 0));

            if ($amount <= 0) {
                return response()->json([
                    'error' => 'Invalid disbursement amount',
                ], 400);
            }

            // Get payment method from request or default to 'manual'
            $paymentMethod = $request->input('paymentMethod', 'manual');

            // Create Payment Transaction record
            $transaction = PaymentTransaction::create([
                'application_id' => $application->id,
                'transaction_amount' => $amount,
                'transaction_status' => 'completed',
                'transaction_method' => $paymentMethod,
                'transaction_reference' => 'MAN-' . strtoupper(uniqid()),
                'initiated_by_user_id' => $this->getCurrentUserId(),
                'initiated_by_name' => $request->input('processedBy', 'Admin User'),
                'completed_at' => now(),
            ]);

            // Create Aid Disbursement record
            $disbursement = AidDisbursement::create([
                'application_id' => $application->id,
                'payment_transaction_id' => $transaction->id,
                'application_number' => $application->application_number,
                'student_id' => $application->student_id,
                'school_id' => $application->school_id,
                'amount' => $amount,
                'disbursement_method' => $paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'manual',
                'payment_provider_name' => 'Manual Processing',
                'payment_provider' => 'manual',
                'disbursement_reference_number' => $transaction->transaction_reference,
                'disbursement_status' => 'completed',
                'disbursed_at' => now(),
                'disbursed_by_user_id' => $this->getCurrentUserId(),
                'disbursed_by_name' => $request->input('processedBy', 'Admin User'),
            ]);

            // Update application status to grants_disbursed
            $application->status = 'grants_disbursed';
            $application->save();

            // Update budget allocation
            $schoolYear = $this->getSchoolYearFromApplication($application);
            $this->updateBudgetOnDisbursement($application, $amount, $schoolYear);

            // Log the action
            AuditLogService::logAction(
                'payment_processed',
                "Manual payment processed for application #{$application->application_number}",
                'scholarship_application',
                (string) $application->id,
                $this->getCurrentUserId(),
                [
                    'payment_transaction_id' => $transaction->id,
                    'disbursement_id' => $disbursement->id,
                    'amount' => $amount,
                    'method' => $paymentMethod,
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully',
                'data' => [
                    'transaction' => $transaction,
                    'disbursement' => $disbursement,
                    'application' => [
                        'id' => $application->id,
                        'status' => $application->status,
                        'application_number' => $application->application_number,
                    ]
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Application not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to process payment',
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

            // Filter by application_id (for student-specific disbursements)
            $applicationId = $request->get('application_id');
            if ($applicationId) {
                $query->where('application_id', $applicationId);
            }

            // Filter by student_id (alternative way to filter by student)
            $studentId = $request->get('student_id');
            if ($studentId) {
                $query->whereHas('application', function ($q) use ($studentId) {
                    $q->where('student_id', $studentId);
                });
            }

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
                    'method' => $disbursement->method ?: $disbursement->disbursement_method,
                    'providerName' => $disbursement->provider_name ?: $disbursement->payment_provider_name,
                    'referenceNumber' => $disbursement->reference_number ?: $disbursement->disbursement_reference_number,
                    'accountNumber' => $disbursement->account_number ?: ($application ? $application->wallet_account_number : null),
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

    public function downloadDisbursementReceipt($id)
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
        $filename = 'receipt_' . ($disbursement->disbursement_reference_number ?? $disbursement->application_number) . '.html';

        return response()->download($absolutePath, $filename, [
            'Content-Type' => 'text/html',
        ]);
    }

    public function getAvailableSchoolYears(): JsonResponse
    {
        try {
            // Get distinct school years that have at least one budget allocation (active or inactive)
            // This allows viewing historical budgets as well
            $schoolYears = BudgetAllocation::whereNotNull('school_year')
                ->where('school_year', '!=', '')
                ->select('school_year')
                ->distinct()
                ->orderBy('school_year', 'desc')
                ->pluck('school_year')
                ->filter()
                ->values()
                ->toArray();

            return response()->json([
                'school_years' => $schoolYears
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch school years',
                'message' => $e->getMessage(),
                'school_years' => []
            ], 500);
        }
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

            // Helper function to get school year from application
            $getSchoolYearFromApplication = function ($application) {
                try {
                    if ($application->student_id) {
                        $academicRecord = DB::table('academic_records')
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
            };

            // Get all approved applications and filter by school year
            $approvedApplications = ScholarshipApplication::where('status', 'approved')->get();
            $needProcessing = $approvedApplications->filter(function ($app) use ($schoolYear, $getSchoolYearFromApplication) {
                $appSchoolYear = $getSchoolYearFromApplication($app);
                return $appSchoolYear === $schoolYear;
            })->count();

            // Get all grants_processing applications and filter by school year
            $processingApplications = ScholarshipApplication::where('status', 'grants_processing')->get();
            $needDisbursing = $processingApplications->filter(function ($app) use ($schoolYear, $getSchoolYearFromApplication) {
                $appSchoolYear = $getSchoolYearFromApplication($app);
                return $appSchoolYear === $schoolYear;
            })->count();

            // Get all disbursed applications and filter by school year
            $disbursedApplications = ScholarshipApplication::where('status', 'grants_disbursed')->get();
            $disbursedCount = $disbursedApplications->filter(function ($app) use ($schoolYear, $getSchoolYearFromApplication) {
                $appSchoolYear = $getSchoolYearFromApplication($app);
                return $appSchoolYear === $schoolYear;
            })->count();

            // Total amount disbursed
            $totalDisbursedAmount = AidDisbursement::sum('amount');

            // Get budget allocations from database (per school year)
            $financialSupportBudget = BudgetAllocation::where('budget_type', 'financial_support')
                ->where('school_year', $schoolYear)
                ->where('is_active', true)
                ->first();

            $scholarshipBenefitsBudget = BudgetAllocation::where('budget_type', 'scholarship_benefits')
                ->where('school_year', $schoolYear)
                ->where('is_active', true)
                ->first();

            // Use database budget allocations - if not set, return zeros
            $financialSupportBudgetTotal = $financialSupportBudget ? $financialSupportBudget->total_budget : 0;
            $scholarshipBenefitsBudgetTotal = $scholarshipBenefitsBudget ? $scholarshipBenefitsBudget->total_budget : 0;

            // Get disbursed amounts from database
            $financialSupportDisbursed = $financialSupportBudget ? $financialSupportBudget->disbursed_budget : 0;
            $scholarshipBenefitsDisbursed = $scholarshipBenefitsBudget ? $scholarshipBenefitsBudget->disbursed_budget : 0;

            // Calculate remaining budgets (total - disbursed)
            $financialSupportRemaining = max(0, $financialSupportBudgetTotal - $financialSupportDisbursed);
            $scholarshipBenefitsRemaining = max(0, $scholarshipBenefitsBudgetTotal - $scholarshipBenefitsDisbursed);

            // Total budget (sum of both types)
            $totalBudget = $financialSupportBudgetTotal + $scholarshipBenefitsBudgetTotal;
            $totalRemaining = $financialSupportRemaining + $scholarshipBenefitsRemaining;

            // Calculate additional metrics for analytics
            $totalApplications = ScholarshipApplication::count();
            $approvedApplications = ScholarshipApplication::where('status', 'approved')->count();
            $processingApplications = ScholarshipApplication::where('status', 'grants_processing')->count();
            $failedApplications = ScholarshipApplication::where('status', 'payment_failed')->count();

            // Calculate pending amount (approved but not yet disbursed)
            $pendingAmount = ScholarshipApplication::whereIn('status', ['approved', 'grants_processing'])
                ->sum('approved_amount') ?: 0;

            // Calculate average processing time (from approved to disbursed)
            $avgProcessingTime = 0;
            $disbursedApps = ScholarshipApplication::where('status', 'grants_disbursed')
                ->whereNotNull('approved_at')
                ->get();

            if ($disbursedApps->count() > 0) {
                $processingTimes = [];
                foreach ($disbursedApps as $app) {
                    $disbursement = AidDisbursement::where('application_id', $app->id)
                        ->whereNotNull('disbursed_at')
                        ->first();
                    if ($disbursement && $app->approved_at) {
                        // Convert to Carbon if needed
                        $approvedAt = is_string($app->approved_at)
                            ? \Carbon\Carbon::parse($app->approved_at)
                            : $app->approved_at;
                        $disbursedAt = is_string($disbursement->disbursed_at)
                            ? \Carbon\Carbon::parse($disbursement->disbursed_at)
                            : $disbursement->disbursed_at;

                        if ($approvedAt && $disbursedAt) {
                            $days = $approvedAt->diffInDays($disbursedAt);
                            $processingTimes[] = $days;
                        }
                    }
                }
                if (count($processingTimes) > 0) {
                    $avgProcessingTime = round(array_sum($processingTimes) / count($processingTimes), 1);
                }
            }

            // Calculate success rate
            $successRate = $totalApplications > 0
                ? round(($disbursedCount / $totalApplications) * 100, 1)
                : 0;

            return response()->json([
                'need_processing' => $needProcessing,
                'need_disbursing' => $needDisbursing,
                'disbursed_count' => $disbursedCount,
                'total_disbursed' => $totalDisbursedAmount,
                'total_budget' => $totalBudget,
                'remaining_budget' => $totalRemaining,
                'utilization_rate' => $totalBudget > 0 ? round(($totalDisbursedAmount / $totalBudget) * 100, 1) : 0,
                'totalApplications' => $totalApplications,
                'approvedApplications' => $approvedApplications,
                'processingApplications' => $processingApplications,
                'failedApplications' => $failedApplications,
                'totalAmount' => $totalDisbursedAmount + $pendingAmount,
                'disbursedAmount' => $totalDisbursedAmount,
                'pendingAmount' => $pendingAmount,
                'averageProcessingTime' => $avgProcessingTime,
                'successRate' => $successRate,
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

    public function getAnalytics(Request $request, $type): JsonResponse
    {
        try {
            $startDate = null;
            $endDate = null;

            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = \Carbon\Carbon::parse($request->get('start_date'))->startOfDay();
                $endDate = \Carbon\Carbon::parse($request->get('end_date'))->endOfDay();
            } else {
                $dateRange = $request->get('range', '30d');
                $endDate = now()->endOfDay();

                $days = match ($dateRange) {
                    '7d' => 7,
                    '30d' => 30,
                    '90d' => 90,
                    '6m' => 180,
                    default => 30
                };
                $startDate = now()->subDays($days)->startOfDay();
            }

            switch ($type) {
                case 'payments':
                    return $this->getPaymentsAnalytics($startDate, $endDate);
                case 'applications':
                    return $this->getApplicationsAnalytics($startDate, $endDate);
                case 'amounts':
                    return $this->getAmountsAnalytics($startDate, $endDate);
                default:
                    return $this->getPaymentsAnalytics($startDate, $endDate);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch analytics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getPaymentsAnalytics($startDate, $endDate): JsonResponse
    {
        // Get daily disbursements
        $dailyDisbursements = DB::table('aid_disbursements')
            ->whereBetween('disbursed_at', [$startDate, $endDate])
            ->whereNotNull('disbursed_at')
            ->selectRaw('DATE(disbursed_at) as date, COUNT(*) as count, SUM(amount) as amount')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => (int) $item->count,
                    'amount' => (float) $item->amount
                ];
            });

        // Fill in missing dates with zero values
        $allDates = [];
        $currentDate = clone $startDate;
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $existing = $dailyDisbursements->firstWhere('date', $dateStr);
            $allDates[] = $existing ?: [
                'date' => $dateStr,
                'count' => 0,
                'amount' => 0
            ];
            $currentDate->addDay();
        }
        $dailyDisbursements = collect($allDates);

        // Get status distribution
        $statusDistribution = ScholarshipApplication::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $total = ScholarshipApplication::count();
                $percentage = $total > 0 ? round(($item->count / $total) * 100, 1) : 0;

                $colors = [
                    'approved' => 'bg-blue-500',
                    'grants_processing' => 'bg-yellow-500',
                    'grants_disbursed' => 'bg-green-500',
                    'payment_failed' => 'bg-red-500',
                    'rejected' => 'bg-gray-500',
                    'submitted' => 'bg-purple-500',
                ];

                return [
                    'status' => ucfirst(str_replace('_', ' ', $item->status)),
                    'count' => (int) $item->count,
                    'percentage' => $percentage,
                    'color' => $colors[$item->status] ?? 'bg-gray-500'
                ];
            });

        // Get school performance (top schools by disbursement amount)
        $schoolPerformance = AidDisbursement::whereBetween('disbursed_at', [$startDate, $endDate])
            ->whereNotNull('school_id')
            ->selectRaw('school_id, COUNT(*) as scholars, SUM(amount) as disbursed')
            ->groupBy('school_id')
            ->orderByDesc('disbursed')
            ->limit(10)
            ->get()
            ->map(function ($item) use ($startDate, $endDate) {
                $school = School::find($item->school_id);
                $avgTime = AidDisbursement::where('school_id', $item->school_id)
                    ->whereBetween('disbursed_at', [$startDate, $endDate])
                    ->whereNotNull('disbursed_at')
                    ->get()
                    ->map(function ($d) {
                        $app = ScholarshipApplication::find($d->application_id);
                        if ($app && $app->approved_at && $d->disbursed_at) {
                            // Convert to Carbon if needed
                            $approvedAt = is_string($app->approved_at)
                                ? \Carbon\Carbon::parse($app->approved_at)
                                : $app->approved_at;
                            $disbursedAt = is_string($d->disbursed_at)
                                ? \Carbon\Carbon::parse($d->disbursed_at)
                                : $d->disbursed_at;

                            if ($approvedAt && $disbursedAt) {
                                return $approvedAt->diffInDays($disbursedAt);
                            }
                        }
                        return null;
                    })
                    ->filter()
                    ->avg();

                return [
                    'school' => $school ? $school->name : 'Unknown School',
                    'scholars' => (int) $item->scholars,
                    'disbursed' => (float) $item->disbursed,
                    'avgTime' => round($avgTime ?: 0, 1)
                ];
            });

        // Get monthly trends
        $monthlyTrends = ScholarshipApplication::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as applications')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                $disbursed = AidDisbursement::whereRaw('DATE_FORMAT(disbursed_at, "%Y-%m") = ?', [$item->month])
                    ->whereNotNull('disbursed_at')
                    ->count();
                $amount = AidDisbursement::whereRaw('DATE_FORMAT(disbursed_at, "%Y-%m") = ?', [$item->month])
                    ->whereNotNull('disbursed_at')
                    ->sum('amount');

                return [
                    'month' => date('M Y', strtotime($item->month . '-01')),
                    'applications' => (int) $item->applications,
                    'disbursed' => (int) $disbursed,
                    'amount' => (float) $amount
                ];
            });

        // Get category distribution for disbursed applications
        $categoryDistribution = [];

        // Get disbursements with their applications
        $disbursements = AidDisbursement::whereBetween('disbursed_at', [$startDate, $endDate])
            ->whereNotNull('disbursed_at')
            ->whereNotNull('application_id')
            ->get();

        if ($disbursements->count() > 0) {
            $categoryGroups = [];
            foreach ($disbursements as $disbursement) {
                $app = ScholarshipApplication::with('category')->find($disbursement->application_id);
                $categoryName = 'Other';

                if ($app) {
                    if ($app->category) {
                        $categoryName = $app->category->name;
                    } elseif ($app->category_id) {
                        // Try to get category name directly from database
                        $category = DB::table('scholarship_categories')
                            ->where('id', $app->category_id)
                            ->first();
                        $categoryName = $category ? $category->name : 'Other';
                    }
                }

                if (!isset($categoryGroups[$categoryName])) {
                    $categoryGroups[$categoryName] = ['count' => 0, 'amount' => 0];
                }
                $categoryGroups[$categoryName]['count']++;
                $categoryGroups[$categoryName]['amount'] += $disbursement->amount;
            }

            $categoryDistribution = array_map(function ($name, $data) {
                return [
                    'name' => $name,
                    'value' => $data['count'],
                    'amount' => $data['amount']
                ];
            }, array_keys($categoryGroups), $categoryGroups);
        } else {
            // Fallback: get from applications
            $applications = ScholarshipApplication::where('status', 'grants_disbursed')
                ->whereNotNull('category_id')
                ->get();

            $categoryGroups = [];
            foreach ($applications as $app) {
                $categoryName = 'Other';
                if ($app->category) {
                    $categoryName = $app->category->name;
                } elseif ($app->category_id) {
                    $category = DB::table('scholarship_categories')
                        ->where('id', $app->category_id)
                        ->first();
                    $categoryName = $category ? $category->name : 'Other';
                }

                if (!isset($categoryGroups[$categoryName])) {
                    $categoryGroups[$categoryName] = ['count' => 0, 'amount' => 0];
                }
                $categoryGroups[$categoryName]['count']++;
                $categoryGroups[$categoryName]['amount'] += $app->approved_amount ?: 0;
            }

            $categoryDistribution = array_map(function ($name, $data) {
                return [
                    'name' => $name,
                    'value' => $data['count'],
                    'amount' => $data['amount']
                ];
            }, array_keys($categoryGroups), $categoryGroups);
        }

        // Calculate percentages
        $total = array_sum(array_column($categoryDistribution, 'value'));
        if ($total > 0) {
            foreach ($categoryDistribution as &$category) {
                $category['percentage'] = round(($category['value'] / $total) * 100, 1);
            }
        }

        // Assign colors to categories
        $colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        foreach ($categoryDistribution as $index => &$category) {
            $category['color'] = $colors[$index % count($colors)];
        }

        return response()->json([
            'labels' => $dailyDisbursements->pluck('date')->map(function ($date) {
                return date('M d', strtotime($date));
            })->toArray(),
            'datasets' => [
                [
                    'label' => 'Disbursements',
                    'data' => $dailyDisbursements->pluck('amount')->toArray(),
                    'borderColor' => 'rgb(59, 130, 246)',
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)'
                ]
            ],
            'dailyDisbursements' => $dailyDisbursements->toArray(),
            'statusDistribution' => $statusDistribution->toArray(),
            'schoolPerformance' => $schoolPerformance->toArray(),
            'monthlyTrends' => $monthlyTrends->toArray(),
            'categoryDistribution' => $categoryDistribution
        ]);
    }

    private function getApplicationsAnalytics($startDate, $endDate): JsonResponse
    {
        // Get weekly application counts
        $weeklyData = ScholarshipApplication::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('WEEK(created_at) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week')
            ->get();

        $labels = [];
        $data = [];

        for ($i = 0; $i < 4; $i++) {
            $week = $endDate->copy()->subWeeks(3 - $i)->format('W');
            $weekData = $weeklyData->firstWhere('week', $week);
            $labels[] = 'Week ' . ($i + 1);
            $data[] = $weekData ? (int) $weekData->count : 0;
        }

        return response()->json([
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Applications',
                    'data' => $data,
                    'borderColor' => 'rgb(59, 130, 246)',
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)'
                ]
            ]
        ]);
    }

    private function getAmountsAnalytics($startDate, $endDate): JsonResponse
    {
        // Get weekly disbursement amounts
        $weeklyData = AidDisbursement::whereBetween('disbursed_at', [$startDate, $endDate])
            ->selectRaw('WEEK(disbursed_at) as week, SUM(amount) as total')
            ->groupBy('week')
            ->orderBy('week')
            ->get();

        $labels = [];
        $data = [];

        for ($i = 0; $i < 4; $i++) {
            $week = $endDate->copy()->subWeeks(3 - $i)->format('W');
            $weekData = $weeklyData->firstWhere('week', $week);
            $labels[] = 'Week ' . ($i + 1);
            $data[] = $weekData ? (float) $weekData->total : 0;
        }

        return response()->json([
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Amount (₱)',
                    'data' => $data,
                    'borderColor' => 'rgb(168, 85, 247)',
                    'backgroundColor' => 'rgba(168, 85, 247, 0.1)'
                ]
            ]
        ]);
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
                $type = DB::table('scholarship_subcategories')
                    ->where('id', $application->subcategory_id)
                    ->value('type');
            }
        }

        if (!$type && $application->category_id) {
            $type = DB::table('scholarship_categories')
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
                $academicRecord = DB::table('academic_records')
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
                // Track who updated the budget
                $userId = $this->getCurrentUserId();
                if ($userId) {
                    $budgetAllocation->updated_by = $userId;
                    $budgetAllocation->save();
                }
            }
        } catch (\Exception $e) {
            // Log error but don't fail the disbursement
            \Log::warning('Failed to update budget allocation: ' . $e->getMessage());
        }
    }

    /**
     * Get all budget allocations
     */
    public function getBudgets(Request $request): JsonResponse
    {
        try {
            $schoolYear = $request->get('school_year');

            $query = BudgetAllocation::query();

            if ($schoolYear) {
                $query->where('school_year', $schoolYear);
            }

            $budgets = $query->orderBy('school_year', 'desc')
                ->orderBy('budget_type', 'asc')
                ->get()
                ->map(function ($budget) {
                    return [
                        'id' => $budget->id,
                        'budget_type' => $budget->budget_type,
                        'school_year' => $budget->school_year,
                        'total_budget' => (float) $budget->total_budget,
                        'allocated_budget' => (float) $budget->allocated_budget,
                        'disbursed_budget' => (float) $budget->disbursed_budget,
                        'remaining_budget' => (float) $budget->remaining_budget,
                        'description' => $budget->description,
                        'is_active' => $budget->is_active,
                        'created_at' => $budget->created_at?->toISOString(),
                        'updated_at' => $budget->updated_at?->toISOString(),
                        'created_by' => $budget->created_by,
                        'updated_by' => $budget->updated_by,
                    ];
                });

            return response()->json([
                'success' => true,
                'budgets' => $budgets,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch budgets', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch budgets',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create or update budget allocation
     */
    public function createOrUpdateBudget(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'budget_type' => 'required|string|max:100',
                'school_year' => 'required|string',
                'total_budget' => 'required|numeric|min:0',
                'description' => 'nullable|string',
            ]);

            $userId = $this->getCurrentUserId();

            $budget = BudgetAllocation::updateOrCreate(
                [
                    'budget_type' => $validated['budget_type'],
                    'school_year' => $validated['school_year'],
                ],
                [
                    'total_budget' => $validated['total_budget'],
                    'description' => $validated['description'] ?? null,
                    'is_active' => true,
                    'updated_by' => $userId,
                    'created_by' => $userId, // Only set on create
                ]
            );

            // Log audit action
            AuditLogService::logAction(
                'budget_updated',
                "Budget allocation {$validated['budget_type']} for {$validated['school_year']} updated",
                'budget_allocation',
                (string) $budget->id,
                null,
                $budget->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Budget allocation saved successfully',
                'data' => [
                    'id' => $budget->id,
                    'budget_type' => $budget->budget_type,
                    'school_year' => $budget->school_year,
                    'total_budget' => $budget->total_budget,
                    'disbursed_budget' => $budget->disbursed_budget,
                    'remaining_budget' => $budget->remaining_budget,
                    'utilization_rate' => $budget->total_budget > 0
                        ? round(($budget->disbursed_budget / $budget->total_budget) * 100, 2)
                        : 0,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to save budget allocation',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user ID from request or auth
     */
    private function getCurrentUserId(): ?int
    {
        try {
            // Try to get from request
            $userId = request()->input('user_id');
            if ($userId) {
                return (int) $userId;
            }

            // Try to get from auth (if available)
            if (auth()->check()) {
                return auth()->id();
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
