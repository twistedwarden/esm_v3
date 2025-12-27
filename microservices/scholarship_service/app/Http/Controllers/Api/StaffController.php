<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Services\AuthServiceClient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StaffController extends Controller
{
    private AuthServiceClient $authService;

    public function __construct(AuthServiceClient $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Get all active interviewers with user data from auth service.
     */
    public function getInterviewers(): JsonResponse
    {
        try {
            $interviewers = Staff::getActiveInterviewersWithUserData();
            
            return response()->json([
                'success' => true,
                'data' => $interviewers,
                'message' => 'Interviewers retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve interviewers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all staff members with user data.
     */
    public function getAllStaff(): JsonResponse
    {
        try {
            $staff = Staff::active()->get();
            $userIds = $staff->pluck('user_id')->toArray();
            $users = $this->authService->getUsersByIds($userIds);
            
            $staffWithUsers = $staff->map(function ($staffMember) use ($users) {
                $userData = $users[$staffMember->user_id] ?? null;
                
                return [
                    'id' => $staffMember->id,
                    'user_id' => $staffMember->user_id,
                    'name' => $userData['name'] ?? 'Unknown User',
                    'email' => $userData['email'] ?? 'unknown@example.com',
                    'system_role' => $staffMember->system_role,
                    'department' => $staffMember->department,
                    'position' => $staffMember->position,
                    'citizen_id' => $staffMember->citizen_id,
                    'is_active' => $staffMember->is_active,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $staffWithUsers,
                'message' => 'Staff members retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve staff members: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff member by ID with user data.
     */
    public function getStaffById(int $id): JsonResponse
    {
        try {
            $staff = Staff::find($id);
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }
            
            $staffWithUser = $staff->withUserData();
            
            return response()->json([
                'success' => true,
                'data' => $staffWithUser,
                'message' => 'Staff member retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve staff member: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new staff member.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer',
                'system_role' => 'required|in:interviewer,reviewer,administrator,coordinator',
                'department' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'citizen_id' => 'nullable|string|max:255',
            ]);

            // Verify user exists in auth service
            $user = $this->authService->getUserById($validated['user_id']);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found in auth service'
                ], 400);
            }

            // Check if staff record already exists for this user
            $existingStaff = Staff::where('user_id', $validated['user_id'])->first();
            if ($existingStaff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record already exists for this user'
                ], 400);
            }

            $staff = Staff::create([
                ...$validated,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $staff->withUserData(),
                'message' => 'Staff member created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create staff member: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update staff member.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $staff = Staff::find($id);
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $validated = $request->validate([
                'system_role' => 'sometimes|in:interviewer,reviewer,administrator,coordinator',
                'department' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'citizen_id' => 'nullable|string|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            $staff->update($validated);

            return response()->json([
                'success' => true,
                'data' => $staff->withUserData(),
                'message' => 'Staff member updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update staff member: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff by user ID (for auth service integration)
     */
    public function getStaffByUserId($userId): JsonResponse
    {
        try {
            $staff = Staff::where('user_id', $userId)
                ->where('is_active', true)
                ->first();
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $staff->id,
                    'user_id' => $staff->user_id,
                    'citizen_id' => $staff->citizen_id,
                    'system_role' => $staff->system_role,
                    'department' => $staff->department,
                    'position' => $staff->position,
                    'is_active' => $staff->is_active,
                ],
                'message' => 'Staff retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify staff by user ID (public endpoint for auth service)
     */
    public function verifyStaff($userId): JsonResponse
    {
        try {
            $staff = Staff::where('user_id', $userId)
                ->where('is_active', true)
                ->first();
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff not found',
                    'data' => null
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $staff->id,
                    'user_id' => $staff->user_id,
                    'citizen_id' => $staff->citizen_id,
                    'system_role' => $staff->system_role,
                    'department' => $staff->department,
                    'position' => $staff->position,
                    'is_active' => $staff->is_active,
                ],
                'message' => 'Staff verified successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify staff member: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}
