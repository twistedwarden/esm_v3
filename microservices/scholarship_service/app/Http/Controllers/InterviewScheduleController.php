<?php

namespace App\Http\Controllers;

use App\Models\InterviewSchedule;
use App\Models\InterviewEvaluation;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InterviewScheduleController extends Controller
{
    /**
     * Display a listing of interview schedules
     */
    public function index(Request $request): JsonResponse
    {
        $query = InterviewSchedule::with([
            'application.student',
            'application.category',
            'application.subcategory',
            'student'
        ]);

        $authUser = $request->get('auth_user');

        // Filter for partner school representatives
        if ($authUser && isset($authUser['role']) && $authUser['role'] === 'ps_rep') {
            if (isset($authUser['citizen_id'])) {
                $partnerRep = \App\Models\PartnerSchoolRepresentative::findByCitizenId($authUser['citizen_id']);
                
                if ($partnerRep) {
                    $query->whereHas('application', function($q) use ($partnerRep) {
                        $q->where('school_id', $partnerRep->school_id);
                    });
                } else {
                    $query->whereRaw('1 = 0');
                }
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('interviewer_id')) {
            $query->where('interviewer_id', $request->interviewer_id);
        }

        if ($request->has('date_from')) {
            $query->where('interview_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('interview_date', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id_number', 'like', "%{$search}%");
            });
        }

        $schedules = $query->orderBy('interview_date', 'asc')
                          ->orderBy('interview_time', 'asc')
                          ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Display the specified interview schedule
     */
    public function show(InterviewSchedule $schedule): JsonResponse
    {
        $schedule->load([
            'application.student.addresses',
            'application.student.familyMembers',
            'application.student.academicRecords',
            'application.student.currentAcademicRecord',
            'application.student.financialInformation',
            'application.category',
            'application.subcategory',
            'student',
            'evaluation'
        ]);

        return response()->json([
            'success' => true,
            'data' => $schedule
        ]);
    }

    /**
     * Store a newly created interview schedule
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_id' => 'required|exists:scholarship_applications,id',
            'interview_date' => 'required|date|after_or_equal:today',
            'interview_time' => 'required|date_format:H:i',
            'interview_location' => 'nullable|string|max:255',
            'interview_type' => 'required|in:in_person,online,phone',
            'meeting_link' => 'nullable|string|max:500',
            'interviewer_id' => 'nullable|integer',
            'staff_id' => 'nullable|integer',
            'interviewer_name' => 'required|string|max:255',
            'scheduling_type' => 'required|in:automatic,manual',
            'notes' => 'nullable|string|max:1000',
            'duration' => 'nullable|integer|min:15|max:120', // Duration in minutes
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $application = ScholarshipApplication::findOrFail($request->application_id);

            if (!$application->canProceedToInterview()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application must have documents reviewed to schedule interview'
                ], 400);
            }

            // Check for interviewer conflicts
            $conflicts = $this->checkInterviewerConflicts(
                $request->staff_id,
                $request->interview_date,
                $request->interview_time,
                $request->duration ?? 30 // Default 30 minutes if not specified
            );

            if (!empty($conflicts)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interviewer has conflicting schedule',
                    'conflicts' => $conflicts
                ], 409); // 409 Conflict status code
            }

            $authUser = $request->get('auth_user');
            $scheduledBy = $authUser['id'] ?? null;

            $interviewData = $request->only([
                'interview_date', 'interview_time', 'interview_location',
                'interview_type', 'meeting_link', 'interviewer_id',
                'staff_id', 'interviewer_name', 'scheduling_type', 'notes', 'duration'
            ]);
            $interviewData['scheduled_by'] = $scheduledBy;
            $interviewData['interview_notes'] = $interviewData['notes'] ?? null;
            unset($interviewData['notes']);

            $schedule = InterviewSchedule::createForApplication($application, $interviewData);

            // Update application status
            $application->scheduleInterviewManually($interviewData, $scheduledBy);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Interview scheduled successfully',
                'data' => $schedule
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create interview schedule', [
                'exception' => $e->getMessage(),
                'payload' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reschedule an interview
     */
    public function reschedule(Request $request, InterviewSchedule $schedule): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'interview_date' => 'required|date|after_or_equal:today',
            'interview_time' => 'required|date_format:H:i',
            'reason' => 'required|string|max:500',
            'duration' => 'nullable|integer|min:15|max:120', // Duration in minutes
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$schedule->canBeRescheduled()) {
            return response()->json([
                'success' => false,
                'message' => 'Interview cannot be rescheduled in current status'
            ], 400);
        }

        try {
            // Check for interviewer conflicts (excluding current schedule)
            $conflicts = $this->checkInterviewerConflicts(
                $schedule->staff_id,
                $request->interview_date,
                $request->interview_time,
                $request->duration ?? $schedule->duration ?? 30,
                $schedule->id // Exclude current schedule
            );

            if (!empty($conflicts)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interviewer has conflicting schedule at the new time',
                    'conflicts' => $conflicts
                ], 409); // 409 Conflict status code
            }

            $authUser = $request->get('auth_user');
            $rescheduledBy = $authUser['id'] ?? null;

            $schedule->reschedule(
                $request->interview_date,
                $request->interview_time,
                $request->reason,
                $rescheduledBy,
                $request->duration ?? $schedule->duration
            );

            return response()->json([
                'success' => true,
                'message' => 'Interview rescheduled successfully',
                'data' => $schedule->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to reschedule interview', [
                'exception' => $e->getMessage(),
                'schedule_id' => $schedule->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to reschedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete an interview with detailed evaluation
     */
    public function complete(Request $request, InterviewSchedule $schedule): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // Legacy fields for backward compatibility
            'interview_result' => 'nullable|in:passed,failed,needs_followup',
            'interview_notes' => 'nullable|string|max:1000',
            
            // New detailed evaluation fields
            'academic_motivation_score' => 'nullable|integer|min:1|max:5',
            'leadership_involvement_score' => 'nullable|integer|min:1|max:5',
            'financial_need_score' => 'nullable|integer|min:1|max:5',
            'character_values_score' => 'nullable|integer|min:1|max:5',
            'overall_recommendation' => 'nullable|in:recommended,not_recommended,needs_followup',
            'remarks' => 'nullable|string|max:2000',
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

        if (!$schedule->canBeCompleted()) {
            return response()->json([
                'success' => false,
                'message' => 'Interview cannot be completed in current status'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $authUser = $request->get('auth_user');
            $completedBy = $authUser['id'] ?? null;

            // Determine interview result from overall recommendation or legacy field
            $interviewResult = $request->overall_recommendation 
                ? match($request->overall_recommendation) {
                    'recommended' => 'passed',
                    'not_recommended' => 'failed',
                    'needs_followup' => 'needs_followup',
                    default => 'needs_followup'
                }
                : $request->interview_result;

            // Create detailed evaluation record
            $evaluationData = [
                'academic_motivation_score' => $request->academic_motivation_score,
                'leadership_involvement_score' => $request->leadership_involvement_score,
                'financial_need_score' => $request->financial_need_score,
                'character_values_score' => $request->character_values_score,
                'overall_recommendation' => $request->overall_recommendation,
                'remarks' => $request->remarks ?: $request->interview_notes,
                'strengths' => $request->strengths,
                'areas_for_improvement' => $request->areas_for_improvement,
                'additional_notes' => $request->additional_notes,
            ];

            $evaluation = InterviewEvaluation::createFromFormData($schedule, $evaluationData, $completedBy);

            // Update interview schedule with basic completion info
            $schedule->markAsCompleted(
                $interviewResult,
                $request->interview_notes ?: $request->remarks,
                $completedBy
            );

            // Update application status to interview_completed
            $schedule->application->update([
                'status' => 'interview_completed',
                'interview_completed_at' => now(),
                'interview_completed_by' => $completedBy,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Interview evaluation submitted successfully',
                'data' => [
                    'schedule' => $schedule->fresh(),
                    'evaluation' => $evaluation
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete interview evaluation', [
                'exception' => $e->getMessage(),
                'schedule_id' => $schedule->id,
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit interview evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel an interview
     */
    public function cancel(Request $request, InterviewSchedule $schedule): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$schedule->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Interview cannot be cancelled in current status'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $cancelledBy = $authUser['id'] ?? null;

            $schedule->cancel($request->reason, $cancelledBy);

            return response()->json([
                'success' => true,
                'message' => 'Interview cancelled successfully',
                'data' => $schedule->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to cancel interview', [
                'exception' => $e->getMessage(),
                'schedule_id' => $schedule->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark interview as no show
     */
    public function markNoShow(Request $request, InterviewSchedule $schedule): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$schedule->canBeMarkedAsNoShow()) {
            return response()->json([
                'success' => false,
                'message' => 'Interview cannot be marked as no show in current status'
            ], 400);
        }

        try {
            $authUser = $request->get('auth_user');
            $markedBy = $authUser['id'] ?? null;

            $schedule->markAsNoShow($request->notes, $markedBy);

            return response()->json([
                'success' => true,
                'message' => 'Interview marked as no show',
                'data' => $schedule->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to mark interview as no show', [
                'exception' => $e->getMessage(),
                'schedule_id' => $schedule->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark interview as no show',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available interview slots
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
            'interview_type' => 'required|in:in_person,online,phone',
            'interviewer_id' => 'nullable|integer',
            'staff_id' => 'nullable|integer',
            'duration' => 'nullable|integer|min:15|max:120', // Duration in minutes
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $date = $request->date;
            $interviewType = $request->interview_type;
            $interviewerId = $request->interviewer_id;
            $staffId = $request->staff_id;
            $duration = $request->duration ?? 30;

            // Define available time slots (9 AM to 5 PM, 30-minute intervals)
            $timeSlots = [];
            $startTime = Carbon::parse($date . ' 09:00');
            $endTime = Carbon::parse($date . ' 17:00');

            while ($startTime->lt($endTime)) {
                $timeSlots[] = $startTime->format('H:i');
                $startTime->addMinutes(30);
            }

            // Get booked slots with duration consideration
            $query = InterviewSchedule::where('interview_date', $date)
                ->where('interview_type', $interviewType)
                ->whereIn('status', ['scheduled', 'rescheduled']);

            // Filter by interviewer or staff
            if ($staffId) {
                $query->where('staff_id', $staffId);
            } elseif ($interviewerId) {
                $query->where('interviewer_id', $interviewerId);
            }

            $bookedSchedules = $query->get();
            $unavailableSlots = [];

            foreach ($bookedSchedules as $schedule) {
                $scheduleStartTime = Carbon::parse($schedule->interview_time);
                $scheduleDuration = $schedule->duration ?? 30;
                $scheduleEndTime = $scheduleStartTime->copy()->addMinutes($scheduleDuration);

                // Mark all slots within the schedule duration as unavailable
                $currentTime = $scheduleStartTime->copy();
                while ($currentTime->lt($scheduleEndTime)) {
                    $unavailableSlots[] = $currentTime->format('H:i');
                    $currentTime->addMinutes(30);
                }
            }

            // Also check for potential conflicts with the requested duration
            $conflictingSlots = [];
            foreach ($timeSlots as $slot) {
                $slotStartTime = Carbon::parse($date . ' ' . $slot);
                $slotEndTime = $slotStartTime->copy()->addMinutes($duration);

                foreach ($bookedSchedules as $schedule) {
                    $scheduleStartTime = Carbon::parse($schedule->interview_date . ' ' . $schedule->interview_time);
                    $scheduleDuration = $schedule->duration ?? 30;
                    $scheduleEndTime = $scheduleStartTime->copy()->addMinutes($scheduleDuration);

                    if ($this->timeRangesOverlap($slotStartTime, $slotEndTime, $scheduleStartTime, $scheduleEndTime)) {
                        $conflictingSlots[] = $slot;
                        break;
                    }
                }
            }

            // Combine unavailable slots
            $allUnavailableSlots = array_unique(array_merge($unavailableSlots, $conflictingSlots));

            // Filter available slots
            $availableSlots = array_diff($timeSlots, $allUnavailableSlots);

            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $date,
                    'interview_type' => $interviewType,
                    'staff_id' => $staffId,
                    'duration' => $duration,
                    'available_slots' => array_values($availableSlots),
                    'unavailable_slots' => array_values($allUnavailableSlots),
                    'booked_schedules' => $bookedSchedules->map(function($schedule) {
                        return [
                            'id' => $schedule->id,
                            'start_time' => $schedule->interview_time,
                            'duration' => $schedule->duration ?? 30,
                            'student_name' => $schedule->application->student->first_name . ' ' . $schedule->application->student->last_name,
                            'interview_type' => $schedule->interview_type,
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get available slots', [
                'exception' => $e->getMessage(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get available slots',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get calendar view of interviews
     */
    public function calendar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $month = $request->month;
            $startDate = Carbon::parse($month . '-01')->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            $interviews = InterviewSchedule::whereBetween('interview_date', [$startDate, $endDate])
                ->with(['student', 'application'])
                ->orderBy('interview_date')
                ->orderBy('interview_time')
                ->get()
                ->groupBy(function($interview) {
                    return Carbon::parse($interview->interview_date)->format('Y-m-d');
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'month' => $month,
                    'interviews' => $interviews,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get calendar data', [
                'exception' => $e->getMessage(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get calendar data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check for interviewer conflicts
     */
    private function checkInterviewerConflicts($staffId, $date, $time, $duration, $excludeScheduleId = null): array
    {
        if (!$staffId) {
            return []; // No conflicts if no staff assigned
        }

        $startTime = Carbon::parse($date . ' ' . $time);
        $endTime = $startTime->copy()->addMinutes($duration);

        $query = InterviewSchedule::where('staff_id', $staffId)
            ->where('interview_date', $date)
            ->whereIn('status', ['scheduled', 'rescheduled']);

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        $existingSchedules = $query->get();
        $conflicts = [];

        foreach ($existingSchedules as $schedule) {
            $existingStartTime = Carbon::createFromFormat('Y-m-d H:i:s', $schedule->interview_date->format('Y-m-d') . ' ' . $schedule->interview_time);
            $existingDuration = $schedule->duration ?? 30; // Default 30 minutes
            $existingEndTime = $existingStartTime->copy()->addMinutes($existingDuration);

            // Check if time ranges overlap
            if ($this->timeRangesOverlap($startTime, $endTime, $existingStartTime, $existingEndTime)) {
                $conflicts[] = [
                    'schedule_id' => $schedule->id,
                    'student_name' => $schedule->application->student->first_name . ' ' . $schedule->application->student->last_name,
                    'start_time' => $existingStartTime->format('H:i'),
                    'end_time' => $existingEndTime->format('H:i'),
                    'display_start_time' => $existingStartTime->format('g:i A'),
                    'display_end_time' => $existingEndTime->format('g:i A'),
                    'interview_type' => $schedule->interview_type,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Check if two time ranges overlap
     */
    private function timeRangesOverlap($start1, $end1, $start2, $end2): bool
    {
        return $start1->lt($end2) && $end1->gt($start2);
    }
}






