<?php

namespace App\Http\Controllers;

use App\Models\PartnerSchoolGuideline;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PartnerSchoolGuidelineController extends Controller
{
    /**
     * Get all active guidelines grouped by section
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $guidelines = PartnerSchoolGuideline::active()
                ->ordered()
                ->get()
                ->groupBy('section');

            return response()->json([
                'success' => true,
                'data' => $guidelines
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching guidelines: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch guidelines'
            ], 500);
        }
    }

    /**
     * Get specific guideline
     */
    public function show($id): JsonResponse
    {
        try {
            $guideline = PartnerSchoolGuideline::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $guideline
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching guideline: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Guideline not found'
            ], 404);
        }
    }

    /**
     * Create new guideline (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'section' => 'required|string|in:requirements,benefits,responsibilities,process',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $authUser = $request->get('auth_user');
            
            $guideline = PartnerSchoolGuideline::create([
                'section' => $request->section,
                'title' => $request->title,
                'content' => $request->content,
                'display_order' => $request->display_order ?? 0,
                'is_active' => $request->is_active ?? true,
                'created_by' => $authUser['id'] ?? null,
            ]);

            Log::info('Guideline created', ['guideline_id' => $guideline->id]);

            return response()->json([
                'success' => true,
                'message' => 'Guideline created successfully',
                'data' => $guideline
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating guideline: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create guideline'
            ], 500);
        }
    }

    /**
     * Update guideline (admin only)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'section' => 'sometimes|string|in:requirements,benefits,responsibilities,process',
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $guideline = PartnerSchoolGuideline::findOrFail($id);
            $authUser = $request->get('auth_user');

            $guideline->update(array_merge(
                $request->only(['section', 'title', 'content', 'display_order', 'is_active']),
                ['updated_by' => $authUser['id'] ?? null]
            ));

            Log::info('Guideline updated', ['guideline_id' => $guideline->id]);

            return response()->json([
                'success' => true,
                'message' => 'Guideline updated successfully',
                'data' => $guideline
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating guideline: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update guideline'
            ], 500);
        }
    }

    /**
     * Delete guideline (admin only)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $guideline = PartnerSchoolGuideline::findOrFail($id);
            $guideline->delete();

            Log::info('Guideline deleted', ['guideline_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Guideline deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting guideline: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete guideline'
            ], 500);
        }
    }

    /**
     * Toggle active status
     */
    public function toggleActive(Request $request, $id): JsonResponse
    {
        try {
            $guideline = PartnerSchoolGuideline::findOrFail($id);
            $guideline->is_active = !$guideline->is_active;
            $guideline->save();

            return response()->json([
                'success' => true,
                'message' => 'Guideline status updated',
                'data' => $guideline
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling guideline status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update guideline status'
            ], 500);
        }
    }
}
