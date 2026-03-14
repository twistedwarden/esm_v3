<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class DocumentTypeController extends Controller
{
    /**
     * Display a listing of all document types (admin — includes inactive).
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentType::query();

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('is_required') && $request->is_required !== '') {
            $query->where('is_required', filter_var($request->is_required, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('level') && in_array($request->level, ['college', 'senior_high', 'vocational', 'all'])) {
            $query->byLevel($request->level);
        }

        $documentTypes = $query->orderBy('category')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $documentTypes,
        ]);
    }

    /**
     * Store a newly created document type.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255|unique:document_types,name',
            'description' => 'nullable|string',
            'category'    => 'required|in:personal,academic,financial,other',
            'is_required' => 'boolean',
            'level'       => 'required|in:college,senior_high,vocational,all',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $documentType = DocumentType::create([
            'name'        => $request->name,
            'description' => $request->description,
            'category'    => $request->category,
            'is_required' => $request->boolean('is_required', false),
            'is_active'   => true,
            'level'       => $request->level,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Requirement created successfully',
            'data'    => $documentType,
        ], 201);
    }

    /**
     * Display the specified document type.
     */
    public function show(DocumentType $documentType): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $documentType,
        ]);
    }

    /**
     * Update the specified document type.
     */
    public function update(Request $request, DocumentType $documentType): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'sometimes|required|string|max:255|unique:document_types,name,' . $documentType->id,
            'description' => 'nullable|string',
            'category'    => 'sometimes|required|in:personal,academic,financial,other',
            'is_required' => 'boolean',
            'is_active'   => 'boolean',
            'level'       => 'sometimes|required|in:college,senior_high,vocational,all',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $documentType->update($request->only([
            'name', 'description', 'category', 'is_required', 'is_active', 'level',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Requirement updated successfully',
            'data'    => $documentType->fresh(),
        ]);
    }

    /**
     * Toggle the active status of the specified document type.
     */
    public function toggle(DocumentType $documentType): JsonResponse
    {
        $documentType->update(['is_active' => !$documentType->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Requirement ' . ($documentType->is_active ? 'activated' : 'deactivated') . ' successfully',
            'data'    => $documentType->fresh(),
        ]);
    }

    /**
     * Remove the specified document type.
     */
    public function destroy(DocumentType $documentType): JsonResponse
    {
        // Prevent deletion if documents are already linked to this type
        if ($documentType->documents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete this requirement — it is linked to existing student documents. Deactivate it instead.',
            ], 409);
        }

        $documentType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Requirement deleted successfully',
        ]);
    }
}
