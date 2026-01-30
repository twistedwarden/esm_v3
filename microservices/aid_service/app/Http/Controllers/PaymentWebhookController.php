<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\PaymentTransaction;
use App\Models\ScholarshipApplication;
use App\Models\AidDisbursement;
use App\Models\BudgetAllocation;
use App\Services\AuditLogService;
use App\Services\ReceiptService;

class PaymentWebhookController extends Controller
{
    public function handlePaymongoWebhook(Request $request)
    {
        try {
            // Log incoming webhook
            $payload = $request->all();
            Log::info('PayMongo webhook received', [
                'payload' => json_encode($payload),
                'headers' => $request->headers->all(),
            ]);

            // PayMongo webhook structure can vary, try multiple paths
            $eventData = $request->input('data');

            // Try different possible structures
            $eventType = null;
            if (isset($eventData['attributes']['type'])) {
                $eventType = $eventData['attributes']['type'];
            } elseif (isset($eventData['type'])) {
                $eventType = $eventData['type'];
            } elseif (isset($payload['type'])) {
                $eventType = $payload['type'];
            } elseif (isset($payload['data']['attributes']['type'])) {
                $eventType = $payload['data']['attributes']['type'];
            }

            Log::info('PayMongo webhook event type', [
                'type' => $eventType,
                'event_data_structure' => array_keys($eventData ?? []),
            ]);

            if ($eventType === 'payment.paid' || $eventType === 'checkout_session.payment.paid') {
                $this->handlePaymentSuccess($eventData ?? $payload);
            } elseif ($eventType === 'payment.failed' || $eventType === 'checkout_session.payment.failed') {
                $this->handlePaymentFailed($eventData ?? $payload);
            } else {
                Log::warning('Unhandled webhook event type', [
                    'type' => $eventType,
                    'full_payload' => $payload,
                ]);
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    private function handlePaymentSuccess($event)
    {
        $transaction = null;
        try {
            DB::beginTransaction();

            // PayMongo webhook structure: data.attributes.data contains the payment
            // Structure: { data: { attributes: { data: { id: "pay_...", attributes: {...} } } } }
            $paymentData = null;
            $paymentId = null;
            $paymentAttributes = null;
            $checkoutSessionId = null;

            // Extract payment data from nested structure
            if (isset($event['attributes']['data'])) {
                // This is the correct structure: data.attributes.data
                $paymentData = $event['attributes']['data'];
            } elseif (isset($event['data']['attributes']['data'])) {
                // Alternative structure
                $paymentData = $event['data']['attributes']['data'];
            } elseif (isset($event['data'])) {
                $paymentData = $event['data'];
            } elseif (isset($event['attributes'])) {
                $paymentData = $event['attributes'];
            } else {
                $paymentData = $event;
            }

            // Extract payment ID and attributes
            if (isset($paymentData['id'])) {
                $paymentId = $paymentData['id'];
            } elseif (isset($paymentData['attributes']['id'])) {
                $paymentId = $paymentData['attributes']['id'];
            }

            // Extract payment attributes
            if (isset($paymentData['attributes'])) {
                $paymentAttributes = $paymentData['attributes'];
            } else {
                $paymentAttributes = $paymentData;
            }

            // Extract checkout session ID (this is what we stored in provider_transaction_id)
            $checkoutSessionId = $paymentAttributes['checkout_session_id'] ?? null;

            if (!$paymentId) {
                Log::warning('Payment ID not found in webhook', [
                    'event_structure' => array_keys($event),
                    'payment_data_keys' => array_keys($paymentData ?? []),
                ]);
                DB::rollBack();
                return;
            }

            Log::info('Processing payment success', [
                'payment_id' => $paymentId,
                'checkout_session_id' => $checkoutSessionId,
                'payment_attributes_keys' => array_keys($paymentAttributes ?? []),
            ]);

            // Find payment transaction by checkout session ID (this is what we stored when creating the payment link)
            // The provider_transaction_id in our database stores the checkout session ID (cs_...), not the payment ID (pay_...)
            $transaction = null;

            if ($checkoutSessionId) {
                Log::info('Searching for transaction by checkout session ID', [
                    'checkout_session_id' => $checkoutSessionId,
                ]);

                $transaction = PaymentTransaction::where('provider_transaction_id', $checkoutSessionId)
                    ->first();

                if ($transaction) {
                    Log::info('Transaction found by checkout session ID', [
                        'transaction_id' => $transaction->id,
                        'application_id' => $transaction->application_id,
                    ]);
                }
            }

            // Fallback: try to find by payment ID or transaction reference
            if (!$transaction) {
                Log::info('Trying fallback search methods', [
                    'payment_id' => $paymentId,
                ]);

                $transaction = PaymentTransaction::where('provider_transaction_id', $paymentId)
                    ->orWhere('transaction_reference', $paymentId)
                    ->first();

                if ($transaction) {
                    Log::info('Transaction found by fallback method', [
                        'transaction_id' => $transaction->id,
                    ]);
                }
            }

            if (!$transaction) {
                Log::warning('Payment transaction not found', [
                    'payment_id' => $paymentId,
                    'checkout_session_id' => $checkoutSessionId,
                    'search_attempts' => [
                        'by_checkout_session' => $checkoutSessionId ? 'tried' : 'not_available',
                        'by_payment_id' => 'tried',
                    ],
                ]);

                // Log all existing transactions for debugging
                $allTransactions = PaymentTransaction::where('transaction_status', 'pending')
                    ->get(['id', 'application_id', 'provider_transaction_id', 'transaction_reference', 'created_at']);
                Log::info('Pending transactions in database', [
                    'count' => $allTransactions->count(),
                    'transactions' => $allTransactions->toArray(),
                ]);

                DB::rollBack();
                return;
            }

            // Check if already processed
            if ($transaction->transaction_status === 'completed') {
                Log::info('Payment already processed', [
                    'transaction_id' => $transaction->id,
                    'payment_id' => $paymentId,
                ]);
                DB::rollBack();
                return;
            }

            // Mark transaction as completed
            // Use the actual payment ID from PayMongo, and update the provider_transaction_id if needed
            $referenceNumber = $paymentAttributes['reference_number'] ?? $paymentData['reference_number'] ?? $transaction->transaction_reference;

            // Update provider_transaction_id to include the actual payment ID for reference
            // Keep checkout session ID but also note the payment ID
            $transaction->markAsCompleted($paymentId, $referenceNumber);

            // Optionally store the payment ID in a separate field or update provider_transaction_id
            // For now, we'll keep the checkout session ID and log the payment ID
            Log::info('Transaction marked as completed', [
                'transaction_id' => $transaction->id,
                'checkout_session_id' => $checkoutSessionId,
                'payment_id' => $paymentId,
                'reference_number' => $referenceNumber,
            ]);

            // Get application
            $application = ScholarshipApplication::find($transaction->application_id);

            if (!$application) {
                Log::error('Application not found for transaction', [
                    'transaction_id' => $transaction->id,
                    'application_id' => $transaction->application_id,
                ]);
                DB::rollBack();
                return;
            }

            // Check if disbursement already exists
            $existingDisbursement = AidDisbursement::where('payment_transaction_id', $transaction->id)
                ->where('disbursement_status', 'completed')
                ->first();

            if ($existingDisbursement) {
                Log::info('Disbursement already exists for this transaction', [
                    'disbursement_id' => $existingDisbursement->id,
                    'transaction_id' => $transaction->id,
                ]);
                DB::rollBack();
                return;
            }

            // Generate receipt FIRST (before creating disbursement)
            // We'll create a temporary disbursement object for receipt generation
            $receiptService = new ReceiptService();

            // Create a temporary disbursement object with the data we need for receipt
            $tempDisbursement = new AidDisbursement();
            $tempDisbursement->disbursement_reference_number = $referenceNumber;
            $tempDisbursement->application_number = $application->application_number;
            $tempDisbursement->amount = $transaction->transaction_amount;
            $tempDisbursement->disbursement_method = 'digital_wallet';
            $tempDisbursement->payment_provider_name = 'PayMongo';
            $tempDisbursement->provider_transaction_id = $paymentId;
            $tempDisbursement->account_number = $application->wallet_account_number;
            $tempDisbursement->disbursed_at = now();

            // Generate receipt
            $receiptPath = $receiptService->generateReceipt($tempDisbursement, $application, $transaction);

            if (!$receiptPath) {
                Log::warning('Failed to generate receipt, continuing without receipt', [
                    'application_id' => $application->id,
                    'transaction_id' => $transaction->id,
                ]);
            }

            // Create disbursement record with receipt_path (nullable, so it's OK if receipt generation failed)
            // Only use columns that exist in the current table structure
            $disbursementData = [
                'application_id' => $application->id,
                'payment_transaction_id' => $transaction->id,
                'application_number' => $application->application_number,
                'student_id' => $application->student_id,
                'school_id' => $application->school_id,
                'amount' => $transaction->transaction_amount,
                'disbursement_method' => 'digital_wallet',
                'payment_provider_name' => 'PayMongo',
                'payment_provider' => 'paymongo',
                'provider_transaction_id' => $paymentId,
                'account_number' => $application->wallet_account_number, // Store account number from application
                'disbursement_reference_number' => $referenceNumber,
                'disbursement_status' => 'completed',
                'receipt_path' => $receiptPath, // Can be null if receipt generation failed
                'disbursed_at' => now(),
                'disbursed_by_user_id' => $transaction->initiated_by_user_id,
                'disbursed_by_name' => $transaction->initiated_by_name ?? 'PayMongo Webhook',
            ];

            // Only add old column names if they exist (for backward compatibility)
            if (Schema::hasColumn('aid_disbursements', 'method')) {
                $disbursementData['method'] = 'digital_wallet';
            }
            if (Schema::hasColumn('aid_disbursements', 'provider_name')) {
                $disbursementData['provider_name'] = 'PayMongo';
            }
            if (Schema::hasColumn('aid_disbursements', 'reference_number')) {
                $disbursementData['reference_number'] = $referenceNumber;
            }

            $disbursement = AidDisbursement::create($disbursementData);

            if ($receiptPath) {
                Log::info('Receipt generated and attached successfully', [
                    'disbursement_id' => $disbursement->id,
                    'receipt_path' => $receiptPath,
                ]);
            } else {
                Log::warning('Disbursement created without receipt', [
                    'disbursement_id' => $disbursement->id,
                ]);
            }

            // Update application status
            $application->status = 'grants_disbursed';
            $application->save();

            // Update budget allocation
            $schoolYear = $this->getSchoolYearFromApplication($application);
            $this->updateBudgetOnDisbursement($application, $transaction->transaction_amount, $schoolYear);

            // Log audit
            AuditLogService::logAction(
                'payment_completed',
                "Payment completed for application #{$application->application_number}",
                'scholarship_application',
                (string) $application->id,
                null,
                [
                    'payment_transaction_id' => $transaction->id,
                    'disbursement_id' => $disbursement->id,
                    'amount' => $transaction->transaction_amount,
                    'receipt_path' => $receiptPath,
                ]
            );

            DB::commit();

            Log::info('Payment processed successfully', [
                'application_id' => $application->id,
                'transaction_id' => $transaction->id,
                'disbursement_id' => $disbursement->id,
                'receipt_path' => $receiptPath,
                'budget_deducted' => true,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to handle payment success', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'event' => json_encode($event),
            ]);

            // If we have a transaction, revert application status to approved
            if (isset($transaction) && $transaction->application_id) {
                try {
                    $application = ScholarshipApplication::find($transaction->application_id);
                    if ($application && $application->status === 'grants_processing') {
                        $application->status = 'approved';
                        $application->save();

                        Log::info('Payment processing error - application status reverted to approved', [
                            'application_id' => $application->id,
                            'transaction_id' => $transaction->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                } catch (\Exception $revertError) {
                    Log::error('Failed to revert application status after payment error', [
                        'error' => $revertError->getMessage(),
                    ]);
                }
            }

            throw $e;
        }
    }

    private function handlePaymentFailed($event)
    {
        try {
            DB::beginTransaction();

            // PayMongo webhook structure: data.attributes.data contains the payment
            $paymentData = $event['attributes']['data'] ?? $event['data'] ?? $event['attributes'] ?? $event;
            $paymentId = $paymentData['id'] ?? null;
            $paymentAttributes = $paymentData['attributes'] ?? $paymentData;

            if (!$paymentId) {
                DB::rollBack();
                return;
            }

            // Try to find transaction by checkout session ID or payment ID
            $transaction = PaymentTransaction::where('provider_transaction_id', $paymentId)
                ->orWhere('transaction_reference', $paymentId)
                ->first();

            // Also try to find by checkout session ID if payment ID doesn't match
            if (!$transaction && isset($paymentAttributes['checkout_session_id'])) {
                $transaction = PaymentTransaction::where('provider_transaction_id', $paymentAttributes['checkout_session_id'])
                    ->first();
            }

            if ($transaction) {
                $failureReason = $paymentAttributes['failure_reason'] ?? $paymentData['failure_reason'] ?? 'Payment failed';
                $transaction->markAsFailed($failureReason);

                // Update application status - revert to 'approved' if it was in 'grants_processing'
                $application = ScholarshipApplication::find($transaction->application_id);
                if ($application) {
                    // Revert status to 'approved' if it was in processing state
                    if (in_array($application->status, ['grants_processing', 'payment_failed'])) {
                        $application->status = 'approved';
                        $application->save();

                        // Log audit
                        AuditLogService::logAction(
                            'payment_failed',
                            "Payment failed for application #{$application->application_number}. Status reverted to approved.",
                            'scholarship_application',
                            (string) $application->id,
                            null,
                            [
                                'payment_transaction_id' => $transaction->id,
                                'failure_reason' => $failureReason,
                                'previous_status' => 'grants_processing',
                                'new_status' => 'approved',
                            ]
                        );

                        Log::info('Payment failed - application status reverted to approved', [
                            'transaction_id' => $transaction->id,
                            'application_id' => $application->id,
                            'previous_status' => 'grants_processing',
                            'new_status' => 'approved',
                            'reason' => $failureReason,
                        ]);
                    } else {
                        Log::info('Payment failed - application status not changed', [
                            'transaction_id' => $transaction->id,
                            'application_id' => $application->id,
                            'current_status' => $application->status,
                            'reason' => $failureReason,
                        ]);
                    }
                } else {
                    Log::warning('Application not found for failed payment transaction', [
                        'transaction_id' => $transaction->id,
                        'application_id' => $transaction->application_id,
                    ]);
                }
            } else {
                Log::warning('Payment transaction not found for failed payment', [
                    'payment_id' => $paymentId,
                ]);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to handle payment failure', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Get school year from application or return current school year
     */
    private function getSchoolYearFromApplication($application): string
    {
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
                Log::warning('budget_allocations table does not exist');
                return;
            }

            $budgetType = $this->getBudgetType($application);

            $budgetAllocation = BudgetAllocation::where('budget_type', $budgetType)
                ->where('school_year', $schoolYear)
                ->where('is_active', true)
                ->first();

            if ($budgetAllocation) {
                $oldDisbursed = $budgetAllocation->disbursed_amount ?? 0;
                $budgetAllocation->incrementDisbursed($amount);
                $budgetAllocation->refresh();

                Log::info('Budget allocation updated', [
                    'budget_id' => $budgetAllocation->id,
                    'budget_type' => $budgetType,
                    'school_year' => $schoolYear,
                    'amount_deducted' => $amount,
                    'old_disbursed' => $oldDisbursed,
                    'new_disbursed' => $budgetAllocation->disbursed_amount,
                    'remaining' => $budgetAllocation->remaining_amount,
                ]);
            } else {
                Log::warning('Budget allocation not found', [
                    'budget_type' => $budgetType,
                    'school_year' => $schoolYear,
                    'amount' => $amount,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update budget allocation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Determine budget type based on application's category/subcategory type
     */
    private function getBudgetType($application): string
    {
        // Default to scholarship_benefits
        // You can enhance this based on your category logic
        return 'scholarship_benefits';
    }
}
