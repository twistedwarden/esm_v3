<?php

namespace App\Services;

use App\Models\InterviewSchedule;
use App\Models\ScholarshipApplication;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class InterviewSlotService
{
    /**
     * Get available interview slots for a specific date and interview type
     */
    public function getAvailableSlots($date, $interviewType = 'in_person', $interviewerId = null): array
    {
        $date = Carbon::parse($date);
        
        if ($date->isWeekend()) {
            return [];
        }

        // Define business hours (9 AM to 5 PM, 30-minute intervals)
        $timeSlots = $this->generateTimeSlots();
        
        // Get booked slots for the date
        $bookedSlots = $this->getBookedSlots($date, $interviewType, $interviewerId);
        
        // Filter available slots
        $availableSlots = [];
        foreach ($timeSlots as $time) {
            $slotKey = $date->format('Y-m-d') . ' ' . $time;
            
            if (!isset($bookedSlots[$slotKey])) {
                $availableSlots[] = [
                    'date' => $date->format('Y-m-d'),
                    'time' => $time,
                    'datetime' => $date->format('Y-m-d') . ' ' . $time,
                    'interview_type' => $interviewType,
                    'location' => $this->getDefaultLocation($interviewType),
                    'meeting_link' => $interviewType === 'online' ? $this->generateMeetingLink() : null,
                ];
            }
        }

        return $availableSlots;
    }

    /**
     * Automatically assign an interview slot for an application
     */
    public function assignSlotAutomatically($applicationId, $preferences = []): ?array
    {
        try {
            $application = ScholarshipApplication::findOrFail($applicationId);
            
            if (!$application->canProceedToInterview()) {
                throw new \Exception('Application is not eligible for interview scheduling');
            }

            // Get available slots for next 7 days
            $availableSlots = $this->getAvailableSlotsForPeriod(7, $preferences);
            
            if (empty($availableSlots)) {
                throw new \Exception('No available interview slots found');
            }

            // Apply optimization logic
            $bestSlot = $this->selectOptimalSlot($availableSlots, $application, $preferences);
            
            if (!$bestSlot) {
                throw new \Exception('No suitable interview slot found');
            }

            return $bestSlot;

        } catch (\Exception $e) {
            Log::error('Failed to assign interview slot automatically', [
                'application_id' => $applicationId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Check for scheduling conflicts
     */
    public function checkConflicts($date, $time, $interviewerId = null): bool
    {
        $date = Carbon::parse($date);
        $time = Carbon::parse($time);
        
        $query = InterviewSchedule::where('interview_date', $date->format('Y-m-d'))
            ->where('interview_time', $time->format('H:i:s'))
            ->whereIn('status', ['scheduled', 'rescheduled']);

        if ($interviewerId) {
            $query->where('interviewer_id', $interviewerId);
        }

        return $query->exists();
    }

    /**
     * Balance interviewer workload across available interviewers
     */
    public function balanceInterviewerWorkload($date = null): array
    {
        $date = $date ? Carbon::parse($date) : now();
        
        // Get interviewer workload for the week
        $workload = InterviewSchedule::whereBetween('interview_date', [
            $date->startOfWeek()->format('Y-m-d'),
            $date->endOfWeek()->format('Y-m-d')
        ])
        ->whereIn('status', ['scheduled', 'rescheduled'])
        ->selectRaw('interviewer_id, COUNT(*) as interview_count')
        ->groupBy('interviewer_id')
        ->pluck('interview_count', 'interviewer_id')
        ->toArray();

        // Define available interviewers (this would come from a config or database)
        $availableInterviewers = $this->getAvailableInterviewers();
        
        // Find the interviewer with the least workload
        $minWorkload = min($workload) ?: 0;
        $availableInterviewer = null;
        
        foreach ($availableInterviewers as $interviewer) {
            $currentWorkload = $workload[$interviewer['id']] ?? 0;
            if ($currentWorkload <= $minWorkload) {
                $availableInterviewer = $interviewer;
                break;
            }
        }

        return $availableInterviewer ?: $availableInterviewers[0] ?? null;
    }

    /**
     * Get available slots for a period of days
     */
    public function getAvailableSlotsForPeriod($days, $preferences = []): array
    {
        $slots = [];
        $startDate = now();
        $endDate = now()->addDays($days);
        
        $interviewType = $preferences['interview_type'] ?? 'in_person';
        $interviewerId = $preferences['interviewer_id'] ?? null;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if ($date->isWeekend()) continue;
            
            $daySlots = $this->getAvailableSlots($date->format('Y-m-d'), $interviewType, $interviewerId);
            $slots = array_merge($slots, $daySlots);
        }

        return $slots;
    }

    /**
     * Generate time slots for business hours
     */
    private function generateTimeSlots(): array
    {
        $timeSlots = [];
        
        // Business hours: 9 AM to 5 PM, 30-minute intervals
        for ($hour = 9; $hour < 17; $hour++) {
            for ($minute = 0; $minute < 60; $minute += 30) {
                $timeSlots[] = sprintf('%02d:%02d', $hour, $minute);
            }
        }

        return $timeSlots;
    }

    /**
     * Get booked slots for a specific date
     */
    private function getBookedSlots($date, $interviewType, $interviewerId = null): array
    {
        $query = InterviewSchedule::where('interview_date', $date->format('Y-m-d'))
            ->where('interview_type', $interviewType)
            ->whereIn('status', ['scheduled', 'rescheduled']);

        if ($interviewerId) {
            $query->where('interviewer_id', $interviewerId);
        }

        return $query->get()
            ->keyBy(function($schedule) {
                return $schedule->interview_date . ' ' . Carbon::parse($schedule->interview_time)->format('H:i');
            })
            ->toArray();
    }

    /**
     * Select the optimal slot based on various criteria
     */
    private function selectOptimalSlot($availableSlots, $application, $preferences = []): ?array
    {
        if (empty($availableSlots)) {
            return null;
        }

        // Apply scoring system
        $scoredSlots = [];
        
        foreach ($availableSlots as $slot) {
            $score = $this->calculateSlotScore($slot, $application, $preferences);
            $scoredSlots[] = array_merge($slot, ['score' => $score]);
        }

        // Sort by score (highest first)
        usort($scoredSlots, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return $scoredSlots[0] ?? null;
    }

    /**
     * Calculate score for a slot based on various factors
     */
    private function calculateSlotScore($slot, $application, $preferences = []): int
    {
        $score = 0;
        $slotDateTime = Carbon::parse($slot['datetime']);

        // Prefer morning slots (9 AM - 12 PM)
        if ($slotDateTime->hour >= 9 && $slotDateTime->hour < 12) {
            $score += 10;
        }

        // Prefer earlier dates
        $daysFromNow = now()->diffInDays($slotDateTime, false);
        if ($daysFromNow >= 0 && $daysFromNow <= 3) {
            $score += 15;
        } elseif ($daysFromNow <= 7) {
            $score += 10;
        }

        // Prefer weekdays
        if ($slotDateTime->isWeekday()) {
            $score += 5;
        }

        // Apply user preferences
        if (isset($preferences['preferred_time']) && 
            $slotDateTime->format('H:i') === $preferences['preferred_time']) {
            $score += 20;
        }

        if (isset($preferences['preferred_date']) && 
            $slotDateTime->format('Y-m-d') === $preferences['preferred_date']) {
            $score += 25;
        }

        // Prefer in-person interviews for certain applications
        if ($slot['interview_type'] === 'in_person' && 
            $this->shouldPreferInPerson($application)) {
            $score += 5;
        }

        return $score;
    }

    /**
     * Determine if application should prefer in-person interview
     */
    private function shouldPreferInPerson($application): bool
    {
        // Add logic based on application characteristics
        // For example, certain scholarship types might require in-person interviews
        return $application->category_id == 1; // Example: Academic Excellence category
    }

    /**
     * Get default location based on interview type
     */
    private function getDefaultLocation($interviewType): string
    {
        switch ($interviewType) {
            case 'online':
                return 'Online Meeting';
            case 'phone':
                return 'Phone Call';
            default:
                return 'Main Office - Room 101';
        }
    }

    /**
     * Generate meeting link for online interviews
     */
    private function generateMeetingLink(): string
    {
        // In a real implementation, this would integrate with a video conferencing service
        return 'https://meet.google.com/' . str_random(10);
    }

    /**
     * Get available interviewers
     */
    private function getAvailableInterviewers(): array
    {
        // In a real implementation, this would come from a database
        return [
            ['id' => 1, 'name' => 'Dr. Maria Santos', 'email' => 'maria.santos@caloocan.gov.ph'],
            ['id' => 2, 'name' => 'Mr. Juan Dela Cruz', 'email' => 'juan.delacruz@caloocan.gov.ph'],
            ['id' => 3, 'name' => 'Ms. Ana Rodriguez', 'email' => 'ana.rodriguez@caloocan.gov.ph'],
        ];
    }

    /**
     * Get scheduling statistics
     */
    public function getSchedulingStats($startDate = null, $endDate = null): array
    {
        $startDate = $startDate ? Carbon::parse($startDate) : now()->startOfMonth();
        $endDate = $endDate ? Carbon::parse($endDate) : now()->endOfMonth();

        $stats = InterviewSchedule::whereBetween('interview_date', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_interviews,
                COUNT(CASE WHEN status = "scheduled" THEN 1 END) as scheduled,
                COUNT(CASE WHEN status = "completed" THEN 1 END) as completed,
                COUNT(CASE WHEN status = "cancelled" THEN 1 END) as cancelled,
                COUNT(CASE WHEN status = "no_show" THEN 1 END) as no_show,
                COUNT(CASE WHEN scheduling_type = "automatic" THEN 1 END) as automatic,
                COUNT(CASE WHEN scheduling_type = "manual" THEN 1 END) as manual
            ')
            ->first();

        return $stats ? $stats->toArray() : [];
    }
}





