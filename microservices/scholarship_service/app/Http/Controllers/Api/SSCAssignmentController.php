<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SscMemberAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SSCAssignmentController extends Controller
{
    /**
     * Get all SSC assignments
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $assignments = SscMemberAssignment::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $assignments,
                'message' => 'SSC assignments retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching SSC assignments', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SSC assignments'
            ], 500);
        }
    }

    /**
     * Get assignments for a specific user
     */
    public function getUserAssignments(int $userId): JsonResponse
    {
        try {
            $assignments = SscMemberAssignment::where('user_id', $userId)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $assignments,
                'message' => 'User SSC assignments retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user SSC assignments', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user SSC assignments'
            ], 500);
        }
    }

    /**
     * Create a new SSC assignment
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
                'ssc_role' => 'required|string|max:255',
                'review_stage' => 'required|string|max:255',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user already has an active assignment for this role
            $existingAssignment = SscMemberAssignment::where('user_id', $request->user_id)
                ->where('ssc_role', $request->ssc_role)
                ->where('is_active', true)
                ->first();

            if ($existingAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'User already has an active assignment for this SSC role'
                ], 400);
            }

            $assignment = SscMemberAssignment::create([
                'user_id' => $request->user_id,
                'ssc_role' => $request->ssc_role,
                'review_stage' => $request->review_stage,
                'is_active' => $request->is_active ?? true,
                'assigned_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $assignment,
                'message' => 'SSC assignment created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating SSC assignment', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create SSC assignment'
            ], 500);
        }
    }

    /**
     * Update an SSC assignment
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $assignment = SscMemberAssignment::find($id);
            
            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'SSC assignment not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'ssc_role' => 'sometimes|string|max:255',
                'review_stage' => 'sometimes|string|max:255',
                'is_active' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assignment->update($request->only(['ssc_role', 'review_stage', 'is_active']));

            return response()->json([
                'success' => true,
                'data' => $assignment,
                'message' => 'SSC assignment updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating SSC assignment', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update SSC assignment'
            ], 500);
        }
    }

    /**
     * Delete an SSC assignment
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $assignment = SscMemberAssignment::find($id);
            
            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'SSC assignment not found'
                ], 404);
            }

            $assignment->delete();

            return response()->json([
                'success' => true,
                'message' => 'SSC assignment deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting SSC assignment', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete SSC assignment'
            ], 500);
        }
    }
}
