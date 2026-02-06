<?php

namespace App\Services;

use App\Models\ScholarshipApplication;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PaymentService
{
    private $secretKey;
    private $publicKey;
    private $baseUrl;
    private $mockEnabled;

    public function __construct()
    {
        $this->secretKey = config('payment.paymongo.secret_key');
        $this->publicKey = config('payment.paymongo.public_key');
        $this->mockEnabled = config('payment.mock_enabled', false);
        $this->baseUrl = config('payment.mode') === 'test'
            ? 'https://api.paymongo.com/v1'
            : 'https://api.paymongo.com/v1';
    }

    /**
     * Create a payment link for an application
     */
    public function createPaymentLink(ScholarshipApplication $application): array
    {
        if ($this->mockEnabled) {
            return $this->createMockPaymentLink($application);
        }

        try {
            $amount = $application->approved_amount ?? 0;
            $amountInCents = (int) ($amount * 100); // Convert to cents
            $frontendUrl = config('payment.frontend.current');

            // Load student information for auto-population
            $application->load('student');
            $student = $application->student;

            // Build billing information for auto-population
            $billing = [];
            if ($student) {
                // Name
                $fullName = trim(($student->first_name ?? '') . ' ' . ($student->middle_name ?? '') . ' ' . ($student->last_name ?? ''));
                $fullName = $fullName ?: ($student->full_name ?? 'Student');
                $billing['name'] = $fullName;

                // Email - check multiple possible field names from scholarship_service Student model
                $email = $student->email_address ?? $student->email ?? null;

                // If student doesn't have email, try to get from user account (if user_id exists)
                if (empty($email) && !empty($student->user_id)) {
                    try {
                        $user = \Illuminate\Support\Facades\DB::connection('auth_service')
                            ->table('users')
                            ->where('id', $student->user_id)
                            ->value('email');
                        if ($user) {
                            $email = $user;
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to get email from user account', [
                            'user_id' => $student->user_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $billing['email'] = trim($email);
                } else {
                    // Log warning if email is missing or invalid
                    Log::warning('Student email not found or invalid for payment auto-population', [
                        'student_id' => $student->id,
                        'application_id' => $application->id,
                        'email_address' => $student->email_address ?? null,
                        'email' => $student->email ?? null,
                        'user_id' => $student->user_id ?? null,
                    ]);
                }

                // Phone - check multiple possible field names (format for Philippines)
                $phone = $student->contact_number ?? $student->preferred_mobile_number ?? $student->phone ?? null;
                if (!empty($phone)) {
                    $formattedPhone = $this->formatPhoneNumber($phone);
                    if ($formattedPhone) {
                        $billing['phone'] = $formattedPhone;
                    }
                }

                // Address (if available)
                $address = $this->getStudentAddress($student);
                if ($address) {
                    $billing['address'] = $address;
                }

                // Log billing info for debugging
                Log::info('Billing information prepared for PayMongo', [
                    'application_id' => $application->id,
                    'student_id' => $student->id,
                    'has_email' => !empty($billing['email']),
                    'has_phone' => !empty($billing['phone']),
                    'has_address' => !empty($billing['address']),
                ]);
            }

            // Build checkout session attributes
            $attributes = [
                'amount' => $amountInCents,
                'currency' => 'PHP',
                'description' => "Scholarship Grant - Application #{$application->application_number}",
                'reference_number' => $application->application_number,
                'line_items' => [
                    [
                        'name' => "Scholarship Grant - {$application->application_number}",
                        'quantity' => 1,
                        'amount' => $amountInCents,
                        'currency' => 'PHP',
                    ],
                ],
                // Determine payment method types based on user preference
                'payment_method_types' => $this->getPaymentMethodTypes($application),
                'success_url' => $frontendUrl . '/admin/school-aid/payment/success?application_id=' . $application->id,
                'cancel_url' => $frontendUrl . '/admin/school-aid/payment/cancel?application_id=' . $application->id,
                'metadata' => [
                    'application_id' => (string) $application->id,
                    'application_number' => $application->application_number,
                    'student_id' => (string) $application->student_id,
                ],
            ];

            // Add billing information if available (for auto-population)
            if (!empty($billing)) {
                $attributes['billing'] = $billing;
                Log::info('Billing information added to PayMongo checkout', [
                    'billing' => $billing,
                    'application_id' => $application->id,
                ]);
            } else {
                Log::warning('No billing information available for auto-population', [
                    'application_id' => $application->id,
                    'student_id' => $student->id ?? null,
                ]);
            }

            // Log the request payload (without sensitive data)
            $logPayload = $attributes;
            if (isset($logPayload['billing']['phone'])) {
                $logPayload['billing']['phone'] = substr($logPayload['billing']['phone'], 0, 7) . '***';
            }
            Log::info('Creating PayMongo checkout session', [
                'application_id' => $application->id,
                'amount' => $amount,
                'has_billing' => !empty($attributes['billing']),
                'billing_fields' => !empty($attributes['billing']) ? array_keys($attributes['billing']) : [],
            ]);

            // Create checkout session via PayMongo API
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/checkout_sessions', [
                        'data' => [
                            'attributes' => $attributes,
                        ],
                    ]);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('PayMongo checkout session creation failed', [
                    'error' => $error,
                    'application_id' => $application->id,
                ]);
                throw new \Exception('Failed to create payment link: ' . ($error['errors'][0]['detail'] ?? 'Unknown error'));
            }

            $data = $response->json();
            $checkout = $data['data']['attributes'];

            return [
                'success' => true,
                'payment_id' => $data['data']['id'],
                'checkout_url' => $checkout['checkout_url'],
                'reference_number' => $checkout['reference_number'] ?? $application->application_number,
                'amount' => $amount,
                'status' => 'pending',
            ];

        } catch (\Exception $e) {
            Log::error('PayMongo payment link creation failed', [
                'error' => $e->getMessage(),
                'application_id' => $application->id,
            ]);

            throw new \Exception('Failed to create payment link: ' . $e->getMessage());
        }
    }

    /**
     * Verify payment status
     */
    public function verifyPayment(string $paymentId): array
    {
        if ($this->mockEnabled) {
            return $this->verifyMockPayment($paymentId);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->get($this->baseUrl . '/payments/' . $paymentId);

            if (!$response->successful()) {
                throw new \Exception('Failed to verify payment');
            }

            $data = $response->json();
            $payment = $data['data']['attributes'];

            return [
                'id' => $data['data']['id'],
                'status' => $payment['status'],
                'amount' => $payment['amount'] / 100, // Convert from cents
                'currency' => $payment['currency'],
                'paid_at' => $payment['paid_at'] ?? null,
                'reference_number' => $payment['reference_number'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('PayMongo payment verification failed', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId,
            ]);

            throw new \Exception('Failed to verify payment: ' . $e->getMessage());
        }
    }

    /**
     * Mock payment for local development
     */
    private function createMockPaymentLink(ScholarshipApplication $application): array
    {
        $paymentId = 'mock_' . uniqid();

        return [
            'success' => true,
            'payment_id' => $paymentId,
            'checkout_url' => route('payment.mock-checkout', ['id' => $paymentId]),
            'reference_number' => 'MOCK-' . $application->application_number,
            'amount' => $application->approved_amount ?? 0,
            'status' => 'pending',
        ];
    }

    private function verifyMockPayment(string $paymentId): array
    {
        // Mock verification logic
        return [
            'id' => $paymentId,
            'status' => 'paid',
            'amount' => 0,
            'currency' => 'PHP',
            'paid_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Format phone number for PayMongo (should start with +63 for Philippines)
     */
    private function formatPhoneNumber(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        // Remove all non-digit characters
        $phone = preg_replace('/\D/', '', $phone);

        // Remove country code if present (PayMongo checkout page adds +63 automatically)
        // If number starts with 63, remove it (keep only local number)
        if (substr($phone, 0, 2) === '63') {
            $phone = substr($phone, 2);
        }

        // If it starts with 0, remove the leading 0
        if (substr($phone, 0, 1) === '0') {
            $phone = substr($phone, 1);
        }

        // Return just the local number (9-10 digits)
        // PayMongo's checkout page will add +63 prefix automatically
        return $phone;
    }

    /**
     * Get student address information
     * Adjust this method based on your actual address structure
     */
    private function getStudentAddress($student): ?array
    {
        // Try to get address from student model or related address table
        // This is a placeholder - adjust based on your schema

        try {
            // Option 1: If address is stored directly on student
            if (isset($student->address) && !empty($student->address)) {
                return [
                    'line1' => $student->address,
                    'country' => 'PH',
                ];
            }

            // Option 2: If address is in a related addresses table
            // Uncomment and adjust if you have an addresses relationship
            /*
            if ($student->addresses && $student->addresses->isNotEmpty()) {
                $address = $student->addresses->first();
                return [
                    'line1' => $address->street ?? $address->line1 ?? '',
                    'line2' => $address->barangay ?? $address->line2 ?? '',
                    'city' => $address->city ?? '',
                    'state' => $address->province ?? $address->state ?? '',
                    'postal_code' => $address->postal_code ?? $address->zip_code ?? '',
                    'country' => 'PH',
                ];
            }
            */

            // Option 3: If address is in JSON format
            if (isset($student->address_data) && is_array($student->address_data)) {
                return array_merge([
                    'country' => 'PH',
                ], $student->address_data);
            }

        } catch (\Exception $e) {
            Log::warning('Failed to get student address', [
                'error' => $e->getMessage(),
                'student_id' => $student->id ?? null,
            ]);
        }

        return null;
    }

    /**
     * Get payment method types based on application preference
     */
    private function getPaymentMethodTypes(ScholarshipApplication $application): array
    {
        // Extract payment method from digital_wallets
        $digitalWallets = $application->digital_wallets ?? [];
        $preferredMethod = null;

        if (is_array($digitalWallets) && count($digitalWallets) > 0) {
            $preferredMethod = $digitalWallets[0];
        } elseif (is_string($digitalWallets)) {
            // In case it's stored as JSON string
            $decoded = json_decode($digitalWallets, true);
            if (is_array($decoded) && count($decoded) > 0) {
                $preferredMethod = $decoded[0];
            } else {
                $preferredMethod = $digitalWallets;
            }
        }

        // Always include 'card'
        $methods = ['card'];

        // Add the preferred method if it's a valid PayMongo type
        if ($preferredMethod) {
            $method = strtolower($preferredMethod);
            if ($method === 'gcash') {
                $methods[] = 'gcash';
            } elseif ($method === 'paymaya' || $method === 'maya') {
                $methods[] = 'paymaya';
            } elseif ($method === 'grab_pay' || $method === 'grabpay') {
                $methods[] = 'grab_pay';
            }
        } else {
            // Fallback if no preference found: include generally available ones
            // Only adding gcash as safe default for now to avoid "Not Configured" error
            $methods[] = 'gcash';
        }

        return array_unique($methods);
    }
}

