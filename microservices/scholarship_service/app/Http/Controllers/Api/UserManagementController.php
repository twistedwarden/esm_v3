<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\SscMemberAssignment;
use App\Services\AuthServiceClient;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserManagementController extends Controller
{
    private AuthServiceClient $authService;
    private string $authServiceUrl;

    public function __construct(AuthServiceClient $authService)
    {
        $this->authService = $authService;
        $this->authServiceUrl = config('services.auth_service.url', 'http://localhost:8000');
    }

    /**
     * Get all users with role filtering and separation
     */
    public function getAllUsers(Request $request): JsonResponse
    {
        try {
            $role = $request->query('role');
            $status = $request->query('status', 'all');
            
            Log::info('Fetching users from auth service', [
                'auth_service_url' => $this->authServiceUrl,
                'role' => $role,
                'status' => $status
            ]);
            
            $response = Http::timeout(10)
                ->get("{$this->authServiceUrl}/api/users", [
                    'role' => $role,
                    'status' => $status
                ]);

            Log::info('Auth service response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body()
            ]);

            if ($response->successful()) {
                $users = $response->json('data', []);
                
                Log::info('Raw users data from auth service', [
                    'users_count' => count($users),
                    'first_user' => $users[0] ?? null
                ]);
                
                // Separate citizens from other roles
                $categorizedUsers = [
                    'citizens' => [],
                    'staff' => [],
                    'admins' => [],
                    'ps_reps' => [],
                    'ssc_city_council' => [],
                    'ssc_budget_dept' => [],
                    'ssc_education_affairs' => [],
                ];
                
                foreach ($users as $user) {
                    Log::info('Processing user', ['user_id' => $user['id'], 'role' => $user['role']]);
                    switch ($user['role']) {
                        case 'citizen':
                            $categorizedUsers['citizens'][] = $user;
                            break;
                        case 'staff':
                            $categorizedUsers['staff'][] = $user;
                            break;
                        case 'admin':
                            $categorizedUsers['admins'][] = $user;
                            break;
                        case 'ps_rep':
                            $categorizedUsers['ps_reps'][] = $user;
                            break;
                        case 'ssc':
                        case 'ssc_city_council':
                            $categorizedUsers['ssc_city_council'][] = $user;
                            break;
                        case 'ssc_budget_dept':
                            $categorizedUsers['ssc_budget_dept'][] = $user;
                            break;
                        case 'ssc_education_affairs':
                            $categorizedUsers['ssc_education_affairs'][] = $user;
                            break;
                        default:
                            Log::warning('Unknown user role', ['role' => $user['role'], 'user_id' => $user['id']]);
                            break;
                    }
                }
                
                Log::info('Categorized users', [
                    'citizens_count' => count($categorizedUsers['citizens']),
                    'staff_count' => count($categorizedUsers['staff']),
                    'admins_count' => count($categorizedUsers['admins']),
                    'ps_reps_count' => count($categorizedUsers['ps_reps']),
                    'ssc_city_council_count' => count($categorizedUsers['ssc_city_council']),
                    'ssc_budget_dept_count' => count($categorizedUsers['ssc_budget_dept']),
                    'ssc_education_affairs_count' => count($categorizedUsers['ssc_education_affairs'])
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $categorizedUsers,
                    'message' => 'Users retrieved successfully'
                ]);
            }

            Log::error('Auth service request failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            AuditLogService::logFailedAction(
                'GET_USERS',
                'Failed to retrieve users from auth service',
                $response->body(),
                'User'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users from auth service',
                'error' => $response->body()
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Error fetching users', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            AuditLogService::logFailedAction(
                'GET_USERS',
                'Exception while retrieving users from auth service',
                $e->getMessage(),
                'User'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users by specific role
     */
    public function getUsersByRole(string $role): JsonResponse
    {
        try {
            // Validate role
            $validRoles = ['admin', 'citizen', 'staff', 'ps_rep'];
            if (!in_array($role, $validRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role specified'
                ], 400);
            }

            $response = Http::timeout(10)
                ->get("{$this->authServiceUrl}/api/users/role/{$role}");

            if ($response->successful()) {
                $data = $response->json('data', []);

                return response()->json([
                    'success' => true,
                    'data' => $data,
                    'message' => ucfirst($role) . ' users retrieved successfully'
                ]);
            }

            AuditLogService::logFailedAction(
                'GET_USERS_BY_ROLE',
                'Failed to retrieve users by role from auth service',
                $response->body(),
                'User'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users from auth service'
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Error fetching users by role', ['role' => $role, 'error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'GET_USERS_BY_ROLE',
                'Exception while retrieving users by role from auth service',
                $e->getMessage(),
                'User'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user by ID
     */
    public function getUserById(int $id): JsonResponse
    {
        try {
            $user = $this->authService->getUserById($id);
            
            if (!$user) {
                AuditLogService::logFailedAction(
                    'GET_USER_BY_ID',
                    'User not found when fetching by ID',
                    'User not found',
                    'User',
                    (string) $id
                );

                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // If user is staff, get their staff record
            if ($user['role'] === 'staff') {
                $staffRecord = Staff::where('user_id', $id)->first();
                if ($staffRecord) {
                    $user['staff_details'] = [
                        'system_role' => $staffRecord->system_role,
                        'department' => $staffRecord->department,
                        'position' => $staffRecord->position,
                        'is_active' => $staffRecord->is_active,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user by ID', ['id' => $id, 'error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'GET_USER_BY_ID',
                'Exception while fetching user by ID',
                $e->getMessage(),
                'User',
                (string) $id
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'citizen_id' => 'required|string',
                'email' => 'required|email',
                'password' => 'required|string|min:8',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'extension_name' => 'nullable|string|max:10',
                'mobile' => 'nullable|string|max:20',
                'birthdate' => 'nullable|date',
                'address' => 'nullable|string',
                'house_number' => 'nullable|string|max:50',
                'street' => 'nullable|string|max:255',
                'barangay' => 'nullable|string|max:255',
                'role' => 'required|in:admin,citizen,staff,ps_rep,ssc,ssc_city_council,ssc_budget_dept,ssc_education_affairs',
                // Staff-specific fields
                'system_role' => 'required_if:role,staff|in:interviewer,reviewer,administrator,coordinator',
                'department' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                // PS Rep-specific fields
                'assigned_school_id' => 'required_if:role,ps_rep|integer',
            ]);

            // Validate school exists for PS reps
            if ($validated['role'] === 'ps_rep' && isset($validated['assigned_school_id'])) {
                $school = \App\Models\School::find($validated['assigned_school_id']);
                if (!$school) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The selected school does not exist'
                    ], 422);
                }
            }

            // Create user in auth service
            Log::info('Creating user in auth service', [
                'url' => "{$this->authServiceUrl}/api/users",
                'data' => $validated
            ]);
            
            $response = Http::timeout(10)
                ->post("{$this->authServiceUrl}/api/users", $validated);

            Log::info('Auth service response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? 'Failed to create user in auth service';

                AuditLogService::logFailedAction(
                    'CREATE_USER',
                    $errorMessage,
                    $response->body(),
                    'User'
                );

                Log::error('Auth service failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? 'Failed to create user in auth service';
                $errors = $errorData['errors'] ?? [];
                
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => $errors,
                    'details' => $response->body()
                ], $response->status());
            }

            $user = $response->json('data');

            AuditLogService::logUserCreation($user);

            // If role is staff, create staff record
            if ($validated['role'] === 'staff' && isset($user['id'])) {
                Staff::create([
                    'user_id' => $user['id'],
                    'citizen_id' => $validated['citizen_id'],
                    'system_role' => $validated['system_role'] ?? 'coordinator',
                    'department' => $validated['department'] ?? null,
                    'position' => $validated['position'] ?? null,
                    'is_active' => true,
                ]);
            }

            // If role is SSC, create SSC assignment
            if (in_array($validated['role'], ['ssc', 'ssc_city_council', 'ssc_budget_dept', 'ssc_education_affairs']) && isset($user['id'])) {
                $this->createSSCAssignment($user['id'], $validated['role']);
            }


            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User created successfully'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error creating user', ['error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'CREATE_USER',
                'Exception while creating user',
                $e->getMessage(),
                'User'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'sometimes|email',
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'extension_name' => 'nullable|string|max:10',
                'mobile' => 'nullable|string|max:20',
                'birthdate' => 'nullable|date',
                'address' => 'nullable|string',
                'house_number' => 'nullable|string|max:50',
                'street' => 'nullable|string|max:255',
                'barangay' => 'nullable|string|max:255',
                'role' => 'sometimes|in:admin,citizen,staff,ps_rep',
                'is_active' => 'sometimes|boolean',
                'status' => 'sometimes|string',
                // Staff-specific fields
                'system_role' => 'sometimes|in:interviewer,reviewer,administrator,coordinator',
                'department' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
            ]);

            // Update user in auth service
            $response = Http::timeout(10)
                ->put("{$this->authServiceUrl}/api/users/{$id}", $validated);

            if (!$response->successful()) {
                AuditLogService::logFailedAction(
                    'UPDATE_USER',
                    'Failed to update user in auth service',
                    $response->body(),
                    'User',
                    (string) $id
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update user in auth service',
                    'errors' => $response->json('errors', [])
                ], $response->status());
            }

            $user = $response->json('data');

            // Log user update
            AuditLogService::logUserUpdate([], $user);

            // Update staff record if exists and staff fields are provided
            if (isset($validated['system_role']) || isset($validated['department']) || isset($validated['position'])) {
                $staffRecord = Staff::where('user_id', $id)->first();
                if ($staffRecord) {
                    $staffRecord->update([
                        'system_role' => $validated['system_role'] ?? $staffRecord->system_role,
                        'department' => $validated['department'] ?? $staffRecord->department,
                        'position' => $validated['position'] ?? $staffRecord->position,
                    ]);
                }
            }

            // Clear cache
            $this->authService->clearUserCache($id);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User updated successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error updating user', ['id' => $id, 'error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'UPDATE_USER',
                'Exception while updating user',
                $e->getMessage(),
                'User',
                (string) $id
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Deactivate user
     */
    public function deleteUser(int $id): JsonResponse
    {
        try {
            // Soft delete by deactivating
            $response = Http::timeout(10)
                ->put("{$this->authServiceUrl}/api/users/{$id}", [
                    'is_active' => false,
                    'status' => 'inactive'
                ]);

            if (!$response->successful()) {
                AuditLogService::logFailedAction(
                    'DEACTIVATE_USER',
                    'Failed to deactivate user in auth service',
                    $response->body(),
                    'User',
                    (string) $id
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to deactivate user'
                ], $response->status());
            }

            // Deactivate staff record if exists
            $staffRecord = Staff::where('user_id', $id)->first();
            if ($staffRecord) {
                $staffRecord->update(['is_active' => false]);
            }

            // Log user deletion
            $user = $response->json('data');
            AuditLogService::logUserDeletion($user);

            // Clear cache
            $this->authService->clearUserCache($id);

            return response()->json([
                'success' => true,
                'message' => 'User deactivated successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting user', ['id' => $id, 'error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'DEACTIVATE_USER',
                'Exception while deactivating user',
                $e->getMessage(),
                'User',
                (string) $id
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function getUserStats(): JsonResponse
    {
        try {
            $response = Http::timeout(10)
                ->get("{$this->authServiceUrl}/api/users/stats");

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json('data', []),
                    'message' => 'User statistics retrieved successfully'
                ]);
            }

            AuditLogService::logFailedAction(
                'GET_USER_STATS',
                'Failed to retrieve user statistics from auth service',
                $response->body(),
                'UserStats'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics'
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Error fetching user stats', ['error' => $e->getMessage()]);

            AuditLogService::logFailedAction(
                'GET_USER_STATS',
                'Exception while retrieving user statistics from auth service',
                $e->getMessage(),
                'UserStats'
            );

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create SSC assignment for a user
     */
    private function createSSCAssignment(int $userId, string $role): void
    {
        try {
            $roleMapping = [
                'ssc' => ['ssc_role' => 'chairperson', 'review_stage' => 'final_approval'],
                'ssc_city_council' => ['ssc_role' => 'city_council', 'review_stage' => 'document_verification'],
                'ssc_budget_dept' => ['ssc_role' => 'budget_department', 'review_stage' => 'financial_review'],
                'ssc_education_affairs' => ['ssc_role' => 'education_affairs', 'review_stage' => 'academic_review'],
            ];

            if (!isset($roleMapping[$role])) {
                Log::warning('Unknown SSC role for assignment', ['role' => $role, 'user_id' => $userId]);
                return;
            }

            $mapping = $roleMapping[$role];

            // Check if assignment already exists
            $existingAssignment = \App\Models\SscMemberAssignment::where('user_id', $userId)
                ->where('is_active', true)
                ->first();

            if ($existingAssignment) {
                Log::info('SSC assignment already exists', ['user_id' => $userId, 'role' => $role]);
                return;
            }

            $assignment = \App\Models\SscMemberAssignment::create([
                'user_id' => $userId,
                'ssc_role' => $mapping['ssc_role'],
                'review_stage' => $mapping['review_stage'],
                'is_active' => true,
                'assigned_at' => now(),
            ]);

            AuditLogService::logAction(
                'CREATE',
                'Created SSC member assignment',
                'SscMemberAssignment',
                (string) $assignment->id,
                null,
                $assignment->toArray()
            );

            Log::info('SSC assignment created successfully', [
                'user_id' => $userId,
                'role' => $role,
                'ssc_role' => $mapping['ssc_role'],
                'review_stage' => $mapping['review_stage']
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating SSC assignment', [
                'user_id' => $userId,
                'role' => $role,
                'error' => $e->getMessage()
            ]);

            AuditLogService::logFailedAction(
                'CREATE_SSC_ASSIGNMENT',
                'Exception while creating SSC member assignment',
                $e->getMessage(),
                'SscMemberAssignment',
                (string) $userId
            );
        }
    }

    /**
     * Activate a user
     */
    public function activateUser(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Activating user', ['user_id' => $id]);

            $response = Http::timeout(10)
                ->put("{$this->authServiceUrl}/api/users/{$id}/activate");

            if ($response->successful()) {
                $user = $response->json('data', []);

                AuditLogService::logAction(
                    'UPDATE',
                    'Activated user: ' . ($user['email'] ?? 'Unknown'),
                    'User',
                    isset($user['id']) ? (string) $user['id'] : (string) $id,
                    ['status' => 'inactive'],
                    ['status' => 'active'],
                    ['activated_via' => 'admin_panel']
                );

                Log::info('User activated successfully', ['user_id' => $id]);
                return response()->json([
                    'success' => true,
                    'message' => 'User activated successfully'
                ]);
            } else {
                Log::error('Failed to activate user', [
                    'user_id' => $id,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                AuditLogService::logFailedAction(
                    'ACTIVATE_USER',
                    'Failed to activate user in auth service',
                    $response->body(),
                    'User',
                    (string) $id
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to activate user: ' . $response->body()
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Error activating user', [
                'user_id' => $id,
                'error' => $e->getMessage()
            ]);

            AuditLogService::logFailedAction(
                'ACTIVATE_USER',
                'Exception while activating user',
                $e->getMessage(),
                'User',
                (string) $id
            );

            return response()->json([
                'success' => false,
                'message' => 'Error activating user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete a user
     */
    public function permanentDeleteUser(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Permanently deleting user', ['user_id' => $id]);

            $response = Http::timeout(10)
                ->delete("{$this->authServiceUrl}/api/users/{$id}/permanent");

            if ($response->successful()) {
                $user = $response->json('data', []);

                AuditLogService::logAction(
                    'DELETE',
                    'Permanently deleted user: ' . ($user['email'] ?? 'Unknown'),
                    'User',
                    isset($user['id']) ? (string) $user['id'] : (string) $id,
                    $user,
                    null,
                    [
                        'deleted_via' => 'admin_panel',
                        'permanent' => true,
                    ]
                );

                Log::info('User permanently deleted successfully', ['user_id' => $id]);
                return response()->json([
                    'success' => true,
                    'message' => 'User permanently deleted successfully'
                ]);
            } else {
                Log::error('Failed to permanently delete user', [
                    'user_id' => $id,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                AuditLogService::logFailedAction(
                    'PERMANENT_DELETE_USER',
                    'Failed to permanently delete user in auth service',
                    $response->body(),
                    'User',
                    (string) $id
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to permanently delete user: ' . $response->body()
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Error permanently deleting user', [
                'user_id' => $id,
                'error' => $e->getMessage()
            ]);

            AuditLogService::logFailedAction(
                'PERMANENT_DELETE_USER',
                'Exception while permanently deleting user',
                $e->getMessage(),
                'User',
                (string) $id
            );

            return response()->json([
                'success' => false,
                'message' => 'Error permanently deleting user: ' . $e->getMessage()
            ], 500);
        }
    }
}
