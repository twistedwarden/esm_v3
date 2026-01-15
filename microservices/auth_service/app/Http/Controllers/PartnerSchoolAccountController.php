<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PartnerSchoolPasswordService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PartnerSchoolAccountController extends Controller
{
    private $passwordService;

    public function __construct(PartnerSchoolPasswordService $passwordService)
    {
        $this->passwordService = $passwordService;
    }

    /**
     * Check if password reset is required
     */
    public function checkPasswordResetRequired(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $requiresReset = $this->passwordService->checkPasswordResetRequired($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'password_reset_required' => $requiresReset
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking password reset requirement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check password reset requirement'
            ], 500);
        }
    }

    /**
     * Force password reset on first login
     */
    public function forcePasswordReset(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:10',
            'confirm_password' => 'required|string|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $success = $this->passwordService->forcePasswordReset(
                $user,
                $request->current_password,
                $request->new_password
            );

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid current password or password reset not required'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error forcing password reset: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password'
            ], 500);
        }
    }

    /**
     * Reset password using token (public endpoint)
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'new_password' => 'required|string|min:10',
            'confirm_password' => 'required|string|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $success = $this->passwordService->resetPasswordWithToken(
                $request->token,
                $request->new_password
            );

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error resetting password: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password'
            ], 500);
        }
    }
}
