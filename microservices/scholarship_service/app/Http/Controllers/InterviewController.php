<?php

namespace App\Http\Controllers;

use App\Models\InterviewSchedule;
use App\Models\InterviewEvaluation;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class InterviewController extends Controller
{
    /**
     * Get interviews assigned to the logged-in interviewer
     */
    public function getMyInterviews(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || !isset($authUser['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userId = $authUser['id'];

            // Get staff record to verify interviewer role
            $staff = Staff::where('user_id', $userId)
                ->where('system_role', 'interviewer')
                ->where('is_active', true)
                ->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not an active interviewer'
                ], 403);
            }

            $query = InterviewSchedule::with([
                'application.student',
                'application.category',
                'application.subcategory',
                'application.school',
                'evaluation'
            ])->where('interviewer_id', $userId);

            // Apply filters
            if ($request->has('status')) {
                if ($request->status === 'pending') {
                    $query->where('status', 'scheduled');
                } elseif ($request->status === 'completed') {
                    $query->where('status', 'completed');
                } elseif ($request->status === 'cancelled') {
                    $query->where('status', 'cancelled');
                }
            }

            if ($request->has('date_from')) {
                $query->where('interview_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('interview_date', '<=', $request->date_to);
            }

            if ($request->has('search')) {
                $searchTerm = $request->search;
                $query->whereHas('application.student', function ($q) use ($searchTerm) {
                    $q->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere('student_id_number', 'like', "%{$searchTerm}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'interview_date');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 20);
            $interviews = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $interviews
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch interviewer interviews', [
                'exception' => $e->getMessage(),
                'user_id' => $authUser['id'] ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interviews',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get interviewer statistics for dashboard
     */
    public function getInterviewerStatistics(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || !isset($authUser['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userId = $authUser['id'];

            // Get staff record
            $staff = Staff::where('user_id', $userId)
                ->where('system_role', 'interviewer')
                ->where('is_active', true)
                ->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not an active interviewer'
                ], 403);
            }

            // Calculate statistics
            $totalInterviews = InterviewSchedule::where('staff_id', $staff->id)->count();
            $pendingInterviews = InterviewSchedule::where('staff_id', $staff->id)
                ->where('status', 'scheduled')
                ->count();
            $completedThisWeek = InterviewSchedule::where('staff_id', $staff->id)
                ->where('status', 'completed')
                ->where('interview_date', '>=', now()->startOfWeek())
                ->count();
            $completedThisMonth = InterviewSchedule::where('staff_id', $staff->id)
                ->where('status', 'completed')
                ->where('interview_date', '>=', now()->startOfMonth())
                ->count();

            // Calculate average scores
            $evaluations = InterviewEvaluation::whereHas('interviewSchedule', function ($q) use ($staff) {
                $q->where('staff_id', $staff->id);
            })->get();

            $averageScores = [
                'academic_motivation' => $evaluations->avg('academic_motivation_score'),
                'leadership_involvement' => $evaluations->avg('leadership_involvement_score'),
                'financial_need' => $evaluations->avg('financial_need_score'),
                'character_values' => $evaluations->avg('character_values_score'),
            ];

            // Get upcoming interviews (next 7 days)
            $upcomingInterviews = InterviewSchedule::with(['application.student'])
                ->where('staff_id', $staff->id)
                ->where('status', 'scheduled')
                ->where('interview_date', '>=', now())
                ->where('interview_date', '<=', now()->addDays(7))
                ->orderBy('interview_date')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_interviews' => $totalInterviews,
                    'pending_interviews' => $pendingInterviews,
                    'completed_this_week' => $completedThisWeek,
                    'completed_this_month' => $completedThisMonth,
                    'average_scores' => $averageScores,
                    'upcoming_interviews' => $upcomingInterviews
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch interviewer statistics', [
                'exception' => $e->getMessage(),
                'user_id' => $authUser['id'] ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit interview evaluation
     */
    public function submitEvaluation(Request $request, InterviewSchedule $schedule): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || !isset($authUser['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userId = $authUser['id'];

            // Get staff record
            $staff = Staff::where('user_id', $userId)
                ->where('system_role', 'interviewer')
                ->where('is_active', true)
                ->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not an active interviewer'
                ], 403);
            }

            // Verify interviewer is assigned to this interview
            if ($schedule->staff_id !== $staff->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this interview'
                ], 403);
            }

            // Validate evaluation data
            $validator = Validator::make($request->all(), [
                'academic_motivation_score' => 'required|integer|min:1|max:5',
                'leadership_involvement_score' => 'required|integer|min:1|max:5',
                'financial_need_score' => 'required|integer|min:1|max:5',
                'character_values_score' => 'required|integer|min:1|max:5',
                'overall_recommendation' => 'required|in:recommended,not_recommended,needs_followup',
                'remarks' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if evaluation already exists
            $existingEvaluation = InterviewEvaluation::where('interview_schedule_id', $schedule->id)->first();
            
            if ($existingEvaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluation already submitted for this interview'
                ], 400);
            }

            // Map frontend recommendation values to database values
            $recommendationMapping = [
                'Highly Recommended' => 'recommended',
                'Recommended' => 'recommended',
                'Not Recommended' => 'not_recommended'
            ];
            
            $dbRecommendation = $recommendationMapping[$request->overall_recommendation] ?? 'recommended';
            
            // Determine interview result based on overall recommendation
            $interviewResultMapping = [
                'Highly Recommended' => 'passed',
                'Recommended' => 'passed',
                'Not Recommended' => 'failed'
            ];
            
            $interviewResult = $interviewResultMapping[$request->overall_recommendation] ?? 'passed';

            // Create evaluation
            $evaluation = InterviewEvaluation::create([
                'interview_schedule_id' => $schedule->id,
                'student_id' => $schedule->application->student_id,
                'application_id' => $schedule->application_id,
                'interviewer_id' => $schedule->interviewer_id, // Add missing interviewer_id
                'interviewer_name' => $authUser['first_name'] . ' ' . $authUser['last_name'],
                'evaluation_date' => now(), // Add missing evaluation_date
                'evaluated_by' => $staff->id,
                'academic_motivation_score' => $request->academic_motivation_score,
                'leadership_involvement_score' => $request->leadership_involvement_score,
                'financial_need_score' => $request->financial_need_score,
                'character_values_score' => $request->character_values_score,
                'overall_recommendation' => $dbRecommendation,
                'interview_result' => $interviewResult,
                'remarks' => $request->remarks,
            ]);

            // Update interview schedule status
            $schedule->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);

            // Update application status based on evaluation recommendation
            $application = $schedule->application;
            $statusUpdate = [
                'interview_completed_at' => now(),
                'interview_completed_by' => $staff->id,
            ];

            // Set status based on overall recommendation
            switch ($request->overall_recommendation) {
                case 'recommended':
                    $statusUpdate['status'] = 'interview_completed';
                    break;
                case 'needs_followup':
                    // Keep as interview_completed but mark for consideration in evaluation
                    $statusUpdate['status'] = 'interview_completed';
                    break;
                case 'not_recommended':
                    $statusUpdate['status'] = 'rejected';
                    $statusUpdate['rejection_reason'] = 'Not recommended after interview evaluation';
                    break;
                default:
                    $statusUpdate['status'] = 'interview_completed';
                    break;
            }

            $application->update($statusUpdate);

            return response()->json([
                'success' => true,
                'message' => 'Interview evaluation submitted successfully',
                'data' => $evaluation->load('interviewSchedule.application.student')
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit interview evaluation', [
                'exception' => $e->getMessage(),
                'schedule_id' => $schedule->id,
                'user_id' => $authUser['id'] ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
