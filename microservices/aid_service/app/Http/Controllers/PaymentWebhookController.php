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

use App\Services\PaymentService;

class PaymentWebhookController extends Controller
{
    public function handlePaymongoWebhook(Request $request, PaymentService $paymentService)
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
                $this->handlePaymentSuccess($eventData ?? $payload, $paymentService);
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

    private function handlePaymentSuccess($event, PaymentService $paymentService)
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

            // Find payment transaction by checkout session ID
            $transaction = null;

            if ($checkoutSessionId) {
                $transaction = PaymentTransaction::where('provider_transaction_id', $checkoutSessionId)
                    ->first();
            }

            // Fallback: try to find by payment ID or transaction reference
            if (!$transaction) {
                $transaction = PaymentTransaction::where('provider_transaction_id', $paymentId)
                    ->orWhere('transaction_reference', $paymentId)
                    ->first();
            }

            if (!$transaction) {
                Log::warning('Payment transaction not found', [
                    'payment_id' => $paymentId,
                ]);
                DB::rollBack();
                return;
            }

            // Use PaymentService to process success
            // Prepare payment data for service
            // Service expects 'id' (payment id) and 'reference_number' in the data
            if (!isset($paymentData['id'])) {
                $paymentData['id'] = $paymentId;
            }
            if (!isset($paymentData['reference_number']) && isset($paymentAttributes['reference_number'])) {
                $paymentData['reference_number'] = $paymentAttributes['reference_number'];
            }

            // Commit current transaction before calling service (which handles its own transaction)
            DB::commit();

            $paymentService->processPaymentSuccess($transaction, $paymentData);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to handle payment success', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'event' => json_encode($event),
            ]);
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
