<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class AcademicPeriodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $periods = AcademicPeriod::orderBy('academic_year', 'desc')
            ->orderBy('period_number', 'desc')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $periods
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'academic_year' => 'required|string',
            'period_type' => 'required|in:Semester,Trimester',
            'period_number' => 'required|integer|min:1|max:3',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'application_deadline' => 'required|date',
            'status' => 'required|in:open,closed',
            'is_current' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // If setting as current, unset others
        if ($request->is_current) {
            AcademicPeriod::where('is_current', true)->update(['is_current' => false]);
        }

        $period = AcademicPeriod::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Academic period created successfully',
            'data' => $period
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AcademicPeriod $academicPeriod)
    {
        $validator = Validator::make($request->all(), [
            'academic_year' => 'string',
            'period_type' => 'in:Semester,Trimester',
            'period_number' => 'integer|min:1|max:3',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'application_deadline' => 'date',
            'status' => 'in:open,closed',
            'is_current' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('is_current') && $request->is_current) {
            AcademicPeriod::where('id', '!=', $academicPeriod->id)
                ->where('is_current', true)
                ->update(['is_current' => false]);
        }

        $academicPeriod->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Academic period updated successfully',
            'data' => $academicPeriod
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AcademicPeriod $academicPeriod)
    {
        $academicPeriod->delete();
        return response()->json([
            'success' => true,
            'message' => 'Academic period deleted successfully'
        ]);
    }
}
