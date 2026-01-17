<?php

namespace App\Http\Controllers;

use App\Models\ScholarshipSubcategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class ScholarshipSubcategoryController extends Controller
{
    /**
     * Display a listing of scholarship subcategories
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScholarshipSubcategory::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $subcategories = $query->orderBy('name', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $subcategories
        ]);
    }

    /**
     * Store a newly created scholarship subcategory
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:scholarship_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|string|in:merit,need_based,special,renewal,field_specific,service',
            'is_active' => 'boolean',
            'requirements' => 'nullable|array',
            'benefits' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $subcategory = ScholarshipSubcategory::create($request->all());

            // Invalidate categories cache as they might include subcategories
            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Scholarship subcategory created successfully',
                'data' => $subcategory
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create scholarship subcategory',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified scholarship subcategory
     */
    public function show(ScholarshipSubcategory $subcategory): JsonResponse
    {
        $subcategory->load('category');

        return response()->json([
            'success' => true,
            'data' => $subcategory
        ]);
    }

    /**
     * Update the specified scholarship subcategory
     */
    public function update(Request $request, ScholarshipSubcategory $subcategory): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'sometimes|required|exists:scholarship_categories,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'sometimes|required|numeric|min:0',
            'type' => 'sometimes|required|string|in:merit,need_based,special,renewal,field_specific,service',
            'is_active' => 'boolean',
            'requirements' => 'nullable|array',
            'benefits' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $subcategory->update($request->all());

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Scholarship subcategory updated successfully',
                'data' => $subcategory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update scholarship subcategory',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified scholarship subcategory
     */
    public function destroy(ScholarshipSubcategory $subcategory): JsonResponse
    {
        try {
            $subcategory->delete();

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Scholarship subcategory deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete scholarship subcategory',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
