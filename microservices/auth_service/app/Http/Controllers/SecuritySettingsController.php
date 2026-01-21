<?php

namespace App\Http\Controllers;

use App\Services\SecuritySettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SecuritySettingsController extends Controller
{
    protected $securitySettingsService;

    public function __construct(SecuritySettingsService $securitySettingsService)
    {
        $this->securitySettingsService = $securitySettingsService;
    }

    /**
     * Get all security settings
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $settings = $this->securitySettingsService->getSettings();
            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch security settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update security settings
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'login_warning_threshold' => 'required|integer|min:3|max:10',
            'login_lockout_threshold' => 'required|integer|min:5|max:15|gt:login_warning_threshold',
            'login_lockout_duration' => 'required|integer|min:60|max:3600',
            'login_attempt_window' => 'required|integer|min:300|max:1800',
            'session_timeout_duration' => 'required|integer|min:60|max:86400',
            'otp_enabled' => 'required|boolean',
        ]);

        try {
            DB::beginTransaction();

            $user = $request->user();
            $userId = $user ? $user->id : null;

            $settings = $this->securitySettingsService->updateSettings($request->all(), $userId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Security settings updated successfully',
                'data' => $settings
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update security settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
