<?php

namespace App\Http\Controllers;

use App\Models\InterviewEvaluation;
use App\Models\InterviewSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class InterviewEvaluationController extends Controller
{
    /**
     * Display a listing of interview evaluations
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InterviewEvaluation::with([
                'application.student',
                'application.school',
                'application.category',
                'application.subcategory',
                'interviewSchedule',
                'student',
                'interviewer'
            ]);

            // Apply filters
            if ($request->has('application_id')) {
                $query->where('application_id', $request->application_id);
            }

            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            if ($request->has('interviewer_id')) {
                $query->where('interviewer_id', $request->interviewer_id);
            }

            if ($request->has('overall_recommendation')) {
                $query->where('overall_recommendation', $request->overall_recommendation);
            }

            if ($request->has('interview_result')) {
                $query->where('interview_result', $request->interview_result);
            }

            if ($request->has('date_from')) {
                $query->whereDate('evaluation_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('evaluation_date', '<=', $request->date_to);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $evaluations = $query->orderBy('evaluation_date', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $evaluations->items(),
                'meta' => [
                    'current_page' => $evaluations->currentPage(),
                    'last_page' => $evaluations->lastPage(),
                    'per_page' => $evaluations->perPage(),
                    'total' => $evaluations->total(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching interview evaluations', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interview evaluations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified interview evaluation
     */
    public function show(int $id): JsonResponse
    {
        try {
            $evaluation = InterviewEvaluation::with([
                'application.student',
                'application.school',
                'application.category',
                'application.subcategory',
                'interviewSchedule',
                'student',
                'interviewer'
            ])->find($id);

            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview evaluation not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $evaluation
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching interview evaluation', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interview evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get evaluations by application ID
     */
    public function getByApplication(int $applicationId): JsonResponse
    {
        try {
            $evaluations = InterviewEvaluation::with([
                'application.student',
                'application.school',
                'application.category',
                'application.subcategory',
                'interviewSchedule',
                'student',
                'interviewer'
            ])->where('application_id', $applicationId)->get();

            return response()->json([
                'success' => true,
                'data' => $evaluations
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching interview evaluations by application', [
                'application_id' => $applicationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interview evaluations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get evaluations by student ID
     */
    public function getByStudent(int $studentId): JsonResponse
    {
        try {
            $evaluations = InterviewEvaluation::with([
                'application.student',
                'application.school',
                'application.category',
                'application.subcategory',
                'interviewSchedule',
                'student',
                'interviewer'
            ])->where('student_id', $studentId)->get();

            return response()->json([
                'success' => true,
                'data' => $evaluations
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching interview evaluations by student', [
                'student_id' => $studentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interview evaluations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created interview evaluation
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'interview_schedule_id' => 'required|exists:interview_schedules,id',
                'academic_motivation_score' => 'required|integer|min:1|max:5',
                'leadership_involvement_score' => 'required|integer|min:1|max:5',
                'financial_need_score' => 'required|integer|min:1|max:5',
                'character_values_score' => 'required|integer|min:1|max:5',
                'overall_recommendation' => 'required|in:recommended,not_recommended,needs_followup',
                'remarks' => 'nullable|string|max:1000',
                'strengths' => 'nullable|string|max:1000',
                'areas_for_improvement' => 'nullable|string|max:1000',
                'additional_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $schedule = InterviewSchedule::find($request->interview_schedule_id);
            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview schedule not found'
                ], 404);
            }

            $authUser = $request->get('auth_user');
            $evaluatedBy = $authUser['id'] ?? null;

            $evaluation = InterviewEvaluation::createFromFormData(
                $schedule,
                $request->all(),
                $evaluatedBy
            );

            // Update the interview schedule status
            $schedule->update([
                'status' => 'completed',
                'interview_result' => $evaluation->interview_result,
                'completed_at' => now()
            ]);

            // Update the application status
            $schedule->application->update([
                'status' => 'interview_completed'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Interview evaluation created successfully',
                'data' => $evaluation->load([
                    'application.student',
                    'application.school',
                    'application.category',
                    'application.subcategory',
                    'interviewSchedule',
                    'student',
                    'interviewer'
                ])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating interview evaluation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create interview evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified interview evaluation
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $evaluation = InterviewEvaluation::find($id);
            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview evaluation not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'academic_motivation_score' => 'sometimes|integer|min:1|max:5',
                'leadership_involvement_score' => 'sometimes|integer|min:1|max:5',
                'financial_need_score' => 'sometimes|integer|min:1|max:5',
                'character_values_score' => 'sometimes|integer|min:1|max:5',
                'overall_recommendation' => 'sometimes|in:recommended,not_recommended,needs_followup',
                'remarks' => 'nullable|string|max:1000',
                'strengths' => 'nullable|string|max:1000',
                'areas_for_improvement' => 'nullable|string|max:1000',
                'additional_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'academic_motivation_score',
                'leadership_involvement_score',
                'financial_need_score',
                'character_values_score',
                'overall_recommendation',
                'remarks',
                'strengths',
                'areas_for_improvement',
                'additional_notes'
            ]);

            // Update interview result if overall recommendation changed
            if (isset($updateData['overall_recommendation'])) {
                $updateData['interview_result'] = match($updateData['overall_recommendation']) {
                    'recommended' => 'passed',
                    'not_recommended' => 'failed',
                    'needs_followup' => 'needs_followup',
                    default => 'needs_followup'
                };
            }

            $evaluation->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Interview evaluation updated successfully',
                'data' => $evaluation->load([
                    'application.student',
                    'application.school',
                    'application.category',
                    'application.subcategory',
                    'interviewSchedule',
                    'student',
                    'interviewer'
                ])
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating interview evaluation', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update interview evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified interview evaluation
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $evaluation = InterviewEvaluation::find($id);
            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview evaluation not found'
                ], 404);
            }

            $evaluation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Interview evaluation deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting interview evaluation', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete interview evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get evaluation statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_evaluations' => InterviewEvaluation::count(),
                'recommended' => InterviewEvaluation::recommended()->count(),
                'not_recommended' => InterviewEvaluation::notRecommended()->count(),
                'needs_followup' => InterviewEvaluation::needsFollowup()->count(),
                'passed' => InterviewEvaluation::passed()->count(),
                'failed' => InterviewEvaluation::failed()->count(),
                'average_scores' => [
                    'academic_motivation' => round(InterviewEvaluation::avg('academic_motivation_score'), 2),
                    'leadership_involvement' => round(InterviewEvaluation::avg('leadership_involvement_score'), 2),
                    'financial_need' => round(InterviewEvaluation::avg('financial_need_score'), 2),
                    'character_values' => round(InterviewEvaluation::avg('character_values_score'), 2),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching evaluation statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch evaluation statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
