<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\OtpVerification;
use App\Services\BrevoEmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected $brevoService;

    public function __construct(BrevoEmailService $brevoService)
    {
        $this->brevoService = $brevoService;
    }

    /**
     * Login user and return token
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'Username or email is required.',
            'password.required' => 'Password is required.',
        ]);

        // Try to find user by citizen_id or email
        $user = User::where('citizen_id', $request->username)
                   ->orWhere('email', $request->username)
                   ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username/email or password'
            ], 401);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active. Please verify your email first.'
            ], 401);
        }

        // Generate and send OTP for login verification
        try {
            $otp = OtpVerification::generateOtp($user->id, 'login');
            $userName = trim($user->first_name . ' ' . $user->last_name);
            
            $this->brevoService->sendLoginOtpEmail(
                $user->email,
                $userName,
                $otp->otp_code,
                $otp->expires_at
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send login OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your email. Please verify to complete login.',
            'data' => [
                'email' => $user->email,
                'requires_otp' => true,
                'expires_in' => 600 // 10 minutes
            ]
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();
        
        $userData = [
            'id' => $user->id,
            'citizen_id' => $user->citizen_id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'middle_name' => $user->middle_name,
            'extension_name' => $user->extension_name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'assigned_school_id' => $user->assigned_school_id,
        ];

        // If user is staff, fetch their staff details from scholarship service
        if ($user->role === 'staff') {
            try {
                $scholarshipServiceUrl = env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8002');
                
                $response = \Illuminate\Support\Facades\Http::timeout(5)
                    ->get($scholarshipServiceUrl . '/api/staff/user/' . $user->id);
                
                if ($response->successful()) {
                    $staffData = $response->json();
                    
                    if (isset($staffData['success']) && $staffData['success'] && isset($staffData['data'])) {
                        $userData['system_role'] = $staffData['data']['system_role'] ?? null;
                        $userData['department'] = $staffData['data']['department'] ?? null;
                        $userData['position'] = $staffData['data']['position'] ?? null;
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to fetch staff details: ' . $e->getMessage());
                // Continue without staff details - frontend will handle missing system_role
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $userData
            ]
        ]);
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:10',
            'birthdate' => 'required|date|before:today',
            'regEmail' => 'required|email|unique:users,email',
            'mobile' => 'required|string|regex:/^09[0-9]{9}$/',
            'address' => 'required|string|max:500',
            'houseNumber' => 'required|string|max:50',
            'street' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'regPassword' => 'required|string|min:10',
            'confirmPassword' => 'required|string|min:10|same:regPassword',
        ], [
            'regEmail.unique' => 'This email is already registered.',
            'mobile.regex' => 'Mobile number must be in format 09XXXXXXXXX.',
            'regPassword.min' => 'Password must be at least 10 characters.',
            'confirmPassword.same' => 'Password confirmation does not match.',
            'birthdate.before' => 'Birthdate must be before today.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate citizen ID
        $citizenId = 'CC' . date('Y') . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);

        // Create user with email_verified_at = now (verified) and status = active
        $user = User::create([
            'citizen_id' => $citizenId,
            'first_name' => $request->firstName,
            'last_name' => $request->lastName,
            'middle_name' => $request->middleName,
            'extension_name' => $request->suffix,
            'email' => $request->regEmail,
            'mobile' => $request->mobile,
            'birthdate' => $request->birthdate,
            'address' => $request->address,
            'house_number' => $request->houseNumber,
            'street' => $request->street,
            'barangay' => $request->barangay,
            'password' => Hash::make($request->regPassword),
            'role' => 'citizen',
            'email_verified_at' => now(), // Email verified immediately
            'status' => 'active', // Set to active immediately
            'email_verification_token' => null, // No token needed
        ]);

        // No OTP required - user is immediately active

        // Create authentication token for automatic login
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful! You are now logged in.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'birthdate' => $user->birthdate,
                    'address' => $user->address,
                    'house_number' => $user->house_number,
                    'street' => $user->street,
                    'barangay' => $user->barangay,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'token' => $token,
                'requires_otp' => false
            ]
        ], 201);
    }

    /**
     * Verify email address
     */
    public function verifyEmail(Request $request, $token)
    {
        $user = User::where('email_verification_token', $token)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification token'
            ], 400);
        }

        $user->update([
            'status' => 'active',
            'email_verification_token' => null,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully'
        ]);
    }

    /**
     * Google OAuth callback
     */
    public function googleCallback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        try {
            // Exchange authorization code for access token
            $client = new \GuzzleHttp\Client([
                'verify' => false, // Disable SSL verification for development
                'timeout' => 30,
            ]);
            $response = $client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id' => env('GOOGLE_CLIENT_ID'),
                    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
                    'code' => $request->code,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => env('GOOGLE_REDIRECT_URI', 'http://localhost:5173'),
                ]
            ]);

            $tokenData = json_decode($response->getBody(), true);
            $accessToken = $tokenData['access_token'];

            // Get user info from Google
            $userResponse = $client->get('https://www.googleapis.com/oauth2/v2/userinfo', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'verify' => false, // Disable SSL verification for development
            ]);

            $googleUser = json_decode($userResponse->getBody(), true);

            // For development mode, we'll skip People API and let users fill forms manually
            // In production, you can enable People API after Google verification
            $additionalInfo = [];

            // Find user by email
            $user = User::where('email', $googleUser['email'])->first();

            // If not registered, instruct frontend to open registration flow
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'code' => 'NOT_REGISTERED',
                    'message' => 'This Google account is not registered. Please complete registration.',
                    'email' => $googleUser['email'] ?? null,
                    'first_name' => $googleUser['given_name'] ?? null,
                    'last_name' => $googleUser['family_name'] ?? null,
                    'additional_info' => $additionalInfo, // Include Google data for pre-filling
                ], 404);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'citizen_id' => $user->citizen_id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                    'token' => $token,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Google OAuth error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed'
            ], 400);
        }
    }

    /**
     * Send OTP for verification
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if ($user->status === 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is already verified'
            ], 400);
        }

        // Generate OTP
        $otp = OtpVerification::generateOtp($user->id, 'email_verification');

        // Send OTP via Brevo
        try {
            $userName = trim($user->first_name . ' ' . $user->last_name);
            
            $this->brevoService->sendOtpEmail(
                $user->email,
                $userName,
                $otp->otp_code,
                $otp->expires_at
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP email. Please try again later.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
            'expires_in' => 600 // 10 minutes
        ]);
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp_code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        
        $otp = OtpVerification::where('user_id', $user->id)
            ->where('otp_code', $request->otp_code)
            ->where('type', 'email_verification')
            ->where('is_used', false)
            ->first();

        if (!$otp || !$otp->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP'
            ], 400);
        }

        // Mark OTP as used
        $otp->markAsUsed();

        // Activate user account
        $user->update([
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create authentication token for automatic login
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Account verified successfully! You are now logged in.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'birthdate' => $user->birthdate,
                    'address' => $user->address,
                    'house_number' => $user->house_number,
                    'street' => $user->street,
                    'barangay' => $user->barangay,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                ],
                'token' => $token
            ]
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
            'confirm_password' => 'required|string|same:new_password',
        ], [
            'current_password.required' => 'Current password is required.',
            'new_password.required' => 'New password is required.',
            'new_password.min' => 'New password must be at least 8 characters.',
            'confirm_password.required' => 'Password confirmation is required.',
            'confirm_password.same' => 'Password confirmation does not match.',
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 400);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Request OTP for login
     */
    public function requestLoginOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active. Please verify your email first.'
            ], 400);
        }

        // Generate OTP for login
        $otp = OtpVerification::generateOtp($user->id, 'login');

        // Send OTP via Brevo
        try {
            $userName = trim($user->first_name . ' ' . $user->last_name);
            
            $this->brevoService->sendLoginOtpEmail(
                $user->email,
                $userName,
                $otp->otp_code,
                $otp->expires_at
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send login OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP email. Please try again later.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your email successfully',
            'expires_in' => 600 // 10 minutes
        ]);
    }

    /**
     * Login with OTP
     */
    public function loginWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp_code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        
        $otp = OtpVerification::where('user_id', $user->id)
            ->where('otp_code', $request->otp_code)
            ->where('type', 'login')
            ->where('is_used', false)
            ->first();

        if (!$otp || !$otp->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP'
            ], 400);
        }

        // Mark OTP as used
        $otp->markAsUsed();

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                ],
                'token' => $token
            ]
        ]);
    }

    /**
     * Register user with Google OAuth
     */
    public function registerWithGoogle(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'mobile' => 'required|string|regex:/^09[0-9]{9}$/',
            'birthdate' => 'required|date|before:today',
            'address' => 'required|string|max:500',
            'houseNumber' => 'required|string|max:50',
            'street' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
        ], [
            'mobile.regex' => 'Mobile number must be in format 09XXXXXXXXX.',
            'birthdate.before' => 'Birthdate must be before today.',
        ]);

        try {
            // Log the incoming request for debugging
            \Log::info('Google registration request:', [
                'code' => $request->code,
                'mobile' => $request->mobile,
                'birthdate' => $request->birthdate,
                'address' => $request->address,
                'houseNumber' => $request->houseNumber,
                'street' => $request->street,
                'barangay' => $request->barangay
            ]);
            
            // Exchange authorization code for access token
            $client = new \GuzzleHttp\Client([
                'verify' => false, // Disable SSL verification for development
                'timeout' => 30,
            ]);
            
            \Log::info('Attempting Google OAuth token exchange with code: ' . $request->code);
            
            $response = $client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id' => env('GOOGLE_CLIENT_ID'),
                    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
                    'code' => $request->code,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => env('GOOGLE_REDIRECT_URI', 'http://localhost:5173'),
                ]
            ]);

            $tokenData = json_decode($response->getBody(), true);
            \Log::info('Google OAuth token response:', $tokenData);
            $accessToken = $tokenData['access_token'];

            // Get user info from Google
            $userResponse = $client->get('https://www.googleapis.com/oauth2/v2/userinfo', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'verify' => false, // Disable SSL verification for development
            ]);

            $googleUser = json_decode($userResponse->getBody(), true);

            // For development mode, we'll skip People API and use form data only
            // In production, you can enable People API after Google verification
            $additionalInfo = [];

            // Check if user already exists
            $existingUser = User::where('email', $googleUser['email'])->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'This Google account is already registered. Please login instead.'
                ], 400);
            }

            // Generate citizen ID
            $citizenId = 'CC' . date('Y') . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);

            // Create user with Google data (use Google data if available, otherwise use form data)
            $user = User::create([
                'citizen_id' => $citizenId,
                'first_name' => $googleUser['given_name'] ?? '',
                'last_name' => $googleUser['family_name'] ?? '',
                'middle_name' => null,
                'extension_name' => null,
                'email' => $googleUser['email'],
                'mobile' => $additionalInfo['mobile'] ?? $request->mobile,
                'birthdate' => $additionalInfo['birthdate'] ?? $request->birthdate,
                'address' => $additionalInfo['address'] ?? $request->address,
                'house_number' => $additionalInfo['houseNumber'] ?? $request->houseNumber,
                'street' => $additionalInfo['street'] ?? $request->street,
                'barangay' => $additionalInfo['barangay'] ?? $request->barangay,
                'password' => Hash::make(Str::random(32)), // Random password for Google users
                'role' => 'citizen',
                'email_verified_at' => now(), // Google emails are pre-verified
                'status' => 'active', // Auto-activate Google users
                'email_verification_token' => null,
            ]);

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration with Google successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'citizen_id' => $user->citizen_id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'middle_name' => $user->middle_name,
                        'extension_name' => $user->extension_name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'is_active' => $user->is_active,
                    ],
                    'token' => $token
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Google registration error: ' . $e->getMessage());
            \Log::error('Google registration stack trace: ' . $e->getTraceAsString());
            
            // Handle specific Google OAuth errors
            if (strpos($e->getMessage(), 'invalid_grant') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google authorization code has expired or is invalid. Please try logging in with Google again.'
                ], 400);
            }
            
            if (strpos($e->getMessage(), 'Malformed auth code') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google authorization code is invalid. Please try logging in with Google again.'
                ], 400);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Google registration failed. Please try again.'
            ], 400);
        }
    }
}
