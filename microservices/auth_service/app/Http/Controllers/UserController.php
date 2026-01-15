<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    /**
     * Get user by ID
     */
    public function getUserById(int $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get multiple users by IDs
     */
    public function getUsersByIds(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'integer'
            ]);
            
            $userIds = $request->input('user_ids');
            $users = User::whereIn('id', $userIds)->get();
            
            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . $user->middle_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all staff users
     */
    public function getStaffUsers(): JsonResponse
    {
        try {
            $staffUsers = User::where('role', 'staff')
                ->where('is_active', true)
                ->get();
            
            $staffData = $staffUsers->map(function ($user) {
                return [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . $user->middle_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $staffData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve staff users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user by email
     */
    public function getUserByEmail(string $email): JsonResponse
    {
        try {
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . $user->middle_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users with optional role filter
     */
    public function getAllUsers(Request $request): JsonResponse
    {
        try {
            $role = $request->query('role');
            $status = $request->query('status');
            
            $query = User::query();
            
            if ($role) {
                $query->where('role', $role);
            }
            
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
            
            $users = $query->get();
            
            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name . ' ' . ($user->extension_name ?? '')),
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'birthdate' => $user->birthdate,
                    'address' => $user->address,
                    'house_number' => $user->house_number,
                    'street' => $user->street,
                    'barangay' => $user->barangay,
                    'role' => $user->role,
                    'status' => $user->status,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role): JsonResponse
    {
        try {
            $users = User::where('role', $role)->get();
            
            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name . ' ' . ($user->extension_name ?? '')),
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request): JsonResponse
    {
        try {
            \Log::info('Creating user with data:', $request->all());
            
            $validated = $request->validate([
                'citizen_id' => 'nullable|string|unique:users,citizen_id',
                'email' => 'required|email|unique:users,email',
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
                'role' => 'required|in:admin,citizen,staff,ps_rep,ssc,ssc_chairperson,ssc_city_council,ssc_budget_dept,ssc_education_affairs,ssc_hrd,ssc_social_services,ssc_accounting,ssc_treasurer,ssc_qcydo,ssc_planning_dept,ssc_schools_division,ssc_qcu',
                'assigned_school_id' => 'nullable|integer',
                'password_reset_required' => 'nullable|boolean',
                'password_reset_token' => 'nullable|string',
                'password_reset_expires_at' => 'nullable|date',
            ]);

            \Log::info('Validation passed, creating user');

            // Auto-generate citizen_id if not provided
            if (empty($validated['citizen_id'])) {
                $validated['citizen_id'] = $this->generateCitizenId($validated['role']);
                \Log::info('Generated citizen_id: ' . $validated['citizen_id']);
            }

            $user = User::create([
                ...$validated,
                'password' => bcrypt($validated['password']),
                'is_active' => true,
                'status' => 'active',
                'password_reset_required' => $request->input('password_reset_required', false),
                'password_reset_token' => $request->input('password_reset_token'),
                'password_reset_expires_at' => $request->input('password_reset_expires_at') ? 
                    \Carbon\Carbon::parse($request->input('password_reset_expires_at')) : null,
            ]);

            \Log::info('User created successfully', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ],
                'message' => 'User created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('User creation validation failed', [
                'errors' => $e->errors(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error creating user', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'request' => $request->all()
            ]);
            
            // Check for duplicate entry errors
            if ($e->getCode() == 23000) {
                $message = 'A user with this citizen ID or email already exists';
                if (str_contains($e->getMessage(), 'citizen_id')) {
                    $message = 'A user with this citizen ID already exists';
                } elseif (str_contains($e->getMessage(), 'email')) {
                    $message = 'A user with this email already exists';
                }
                return response()->json([
                    'success' => false,
                    'message' => $message
                ], 409);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error creating user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
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
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validated = $request->validate([
                'email' => 'sometimes|email|unique:users,email,' . $id,
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
                'role' => 'sometimes|in:admin,citizen,staff,ps_rep,ssc,ssc_chairperson,ssc_city_council,ssc_budget_dept,ssc_education_affairs,ssc_hrd,ssc_social_services,ssc_accounting,ssc_treasurer,ssc_qcydo,ssc_planning_dept,ssc_schools_division,ssc_qcu',
                'is_active' => 'sometimes|boolean',
                'status' => 'sometimes|string',
            ]);

            $user->update($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'extension_name' => $user->extension_name,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'updated_at' => $user->updated_at,
                ],
                'message' => 'User updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function getUserStats(): JsonResponse
    {
        try {
            $stats = [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
                'by_role' => [
                    'citizens' => User::where('role', 'citizen')->count(),
                    'staff' => User::where('role', 'staff')->count(),
                    'admins' => User::where('role', 'admin')->count(),
                    'ps_reps' => User::where('role', 'ps_rep')->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a school to a user (for PS reps)
     */
    public function assignSchool(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'school_id' => 'required|integer'
            ]);

            $user = User::findOrFail($id);
            
            // Only allow assignment for PS reps
            if ($user->role !== 'ps_rep') {
                return response()->json([
                    'success' => false,
                    'message' => 'School assignment is only allowed for Partner School Representatives'
                ], 400);
            }

            // Validate school exists by calling scholarship service
            $scholarshipServiceUrl = env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8001');
            $schoolResponse = \Http::timeout(10)
                ->get("{$scholarshipServiceUrl}/api/schools/{$validated['school_id']}");

            if (!$schoolResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'School not found or invalid'
                ], 404);
            }

            // Check if the assigned_school_id column exists
            if (!Schema::hasColumn('users', 'assigned_school_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'School assignment feature not available. Please run the migration first.'
                ], 500);
            }

            $user->update(['assigned_school_id' => $validated['school_id']]);

            // Get school data for response
            $schoolData = $schoolResponse->json('data');

            return response()->json([
                'success' => true,
                'message' => 'School assigned successfully',
                'data' => [
                    'id' => $user->id,
                    'citizen_id' => $user->citizen_id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => $user->role,
                    'assigned_school_id' => $user->assigned_school_id,
                    'assigned_school' => $schoolData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign school: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unassign school from a user
     */
    public function unassignSchool(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['assigned_school_id' => null]);

            return response()->json([
                'success' => true,
                'message' => 'School unassigned successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unassign school: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user (soft delete by setting is_active to false)
     */
    public function deleteUser(int $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user is already inactive
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already inactive. Use permanent delete to remove completely.',
                    'requires_permanent_delete' => true
                ], 400);
            }

            // Soft delete by deactivating the user
            $user->update([
                'is_active' => false,
                'status' => 'deactivated'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User deactivated successfully. Delete again to permanently remove.',
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name . ' ' . ($user->extension_name ?? '')),
                    'is_active' => $user->is_active,
                    'status' => $user->status,
                    'deactivated_at' => now()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activate user (set is_active to true)
     */
    public function activateUser(int $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user is already active
            if ($user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already active'
                ], 400);
            }

            // Activate the user
            $user->update([
                'is_active' => true,
                'status' => 'active'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User activated successfully',
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => trim($user->first_name . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name . ' ' . ($user->extension_name ?? '')),
                    'is_active' => $user->is_active,
                    'status' => $user->status,
                    'activated_at' => now()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete user from database
     */
    public function permanentDeleteUser(int $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Store user info before deletion for response
            $userInfo = [
                'id' => $user->id,
                'email' => $user->email,
                'name' => trim($user->first_name . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name . ' ' . ($user->extension_name ?? '')),
                'role' => $user->role,
                'deleted_at' => now()
            ];

            // Permanently delete the user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User permanently deleted successfully',
                'data' => $userInfo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a unique citizen ID based on role
     */
    private function generateCitizenId(string $role): string
    {
        // Map roles to prefixes
        $rolePrefixes = [
            'citizen' => 'CITIZEN',
            'staff' => 'STAFF',
            'admin' => 'ADMIN',
            'ps_rep' => 'PSREP',
            'ssc' => 'SSC',
            'ssc_chairperson' => 'SSC',
            'ssc_city_council' => 'SSC',
            'ssc_budget_dept' => 'SSC',
            'ssc_education_affairs' => 'SSC',
            'ssc_hrd' => 'SSC',
            'ssc_social_services' => 'SSC',
            'ssc_accounting' => 'SSC',
            'ssc_treasurer' => 'SSC',
            'ssc_qcydo' => 'SSC',
            'ssc_planning_dept' => 'SSC',
            'ssc_schools_division' => 'SSC',
            'ssc_qcu' => 'SSC',
        ];

        $prefix = $rolePrefixes[$role] ?? 'USER';

        // Find the highest number for this prefix
        $maxNumber = 0;
        $existingUsers = User::where('citizen_id', 'LIKE', $prefix . '-%')->get();
        
        foreach ($existingUsers as $user) {
            if (preg_match('/' . preg_quote($prefix) . '-(\d+)/', $user->citizen_id, $matches)) {
                $number = (int)$matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        }

        // Generate next ID
        $nextNumber = $maxNumber + 1;
        $citizenId = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        // Ensure uniqueness (in case of race condition)
        $attempts = 0;
        while (User::where('citizen_id', $citizenId)->exists() && $attempts < 10) {
            $nextNumber++;
            $citizenId = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            $attempts++;
        }

        return $citizenId;
    }
}
