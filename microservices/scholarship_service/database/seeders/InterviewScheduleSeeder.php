<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InterviewSchedule;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use Carbon\Carbon;

class InterviewScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some applications that are in documents_reviewed status
        $applications = ScholarshipApplication::where('status', 'documents_reviewed')
            ->with(['student'])
            ->limit(15)
            ->get();

        if ($applications->isEmpty()) {
            $this->command->warn('No applications found in documents_reviewed status. Please create some applications first.');
            return;
        }

        // Get actual staff members from the database
        $staffMembers = \App\Models\Staff::where('is_active', true)->get();
        
        if ($staffMembers->isEmpty()) {
            $this->command->warn('No staff members found. Please run StaffSeeder first.');
            return;
        }

        foreach ($applications as $index => $application) {
            $staff = $staffMembers[$index % $staffMembers->count()];
            
            // Create interview schedule
            $interviewDate = $this->getRandomInterviewDate();
            $interviewTime = $this->getRandomInterviewTime();
            
            InterviewSchedule::create([
                'application_id' => $application->id,
                'student_id' => $application->student_id,
                'interview_date' => $interviewDate,
                'interview_time' => $interviewTime,
                'interview_location' => $this->getRandomLocation(),
                'interview_type' => $this->getRandomInterviewType(),
                'meeting_link' => $this->getRandomMeetingLink(),
                'staff_id' => $staff->id,
                'interviewer_name' => 'Staff Member ' . $staff->id,
                'scheduling_type' => $this->getRandomSchedulingType(),
                'status' => $this->getRandomStatus(),
                'interview_notes' => $this->getRandomNotes(),
                'interview_result' => $this->getRandomResult(),
                'completed_at' => $this->getRandomCompletedAt(),
                'duration' => $this->getRandomDuration(),
                'scheduled_by' => 1, // Admin user
            ]);
        }

        $this->command->info('Interview schedule records created successfully!');
    }

    /**
     * Get random interview date (next 30 days)
     */
    private function getRandomInterviewDate(): string
    {
        $startDate = now()->addDays(1);
        $endDate = now()->addDays(30);
        
        $randomDays = rand(1, 29);
        return $startDate->addDays($randomDays)->format('Y-m-d');
    }

    /**
     * Get random interview time (business hours)
     */
    private function getRandomInterviewTime(): string
    {
        $hours = [9, 10, 11, 13, 14, 15, 16]; // Business hours
        $minutes = [0, 30]; // 30-minute intervals
        
        $hour = $hours[array_rand($hours)];
        $minute = $minutes[array_rand($minutes)];
        
        return sprintf('%02d:%02d:00', $hour, $minute);
    }

    /**
     * Get random interview location
     */
    private function getRandomLocation(): string
    {
        $locations = [
            'Main Office - Room 101',
            'Main Office - Room 102',
            'Conference Room A',
            'Conference Room B',
            'Student Services Office',
            'Online Meeting',
        ];
        return $locations[array_rand($locations)];
    }

    /**
     * Get random interview type
     */
    private function getRandomInterviewType(): string
    {
        $types = ['in_person', 'online', 'phone'];
        return $types[array_rand($types)];
    }

    /**
     * Get random meeting link (for online interviews)
     */
    private function getRandomMeetingLink(): ?string
    {
        $links = [
            'https://meet.google.com/abc-defg-hij',
            'https://zoom.us/j/123456789',
            'https://teams.microsoft.com/l/meetup-join/...',
            null, // For in-person interviews
        ];
        return $links[array_rand($links)];
    }

    /**
     * Get random scheduling type
     */
    private function getRandomSchedulingType(): string
    {
        $types = ['automatic', 'manual'];
        return $types[array_rand($types)];
    }

    /**
     * Get random interview status
     */
    private function getRandomStatus(): string
    {
        $statuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
        return $statuses[array_rand($statuses)];
    }

    /**
     * Get random interview notes
     */
    private function getRandomNotes(): ?string
    {
        $notes = [
            'Student showed good academic performance.',
            'Excellent communication skills demonstrated.',
            'Strong motivation for pursuing higher education.',
            'Student needs to improve in certain areas.',
            'Follow-up interview recommended.',
            'Student did not show up for scheduled interview.',
            'Interview cancelled due to emergency.',
            null,
        ];
        return $notes[array_rand($notes)];
    }

    /**
     * Get random interview result
     */
    private function getRandomResult(): ?string
    {
        $results = ['passed', 'failed', 'needs_followup', null];
        return $results[array_rand($results)];
    }

    /**
     * Get random completed at timestamp
     */
    private function getRandomCompletedAt(): ?string
    {
        $shouldHaveCompletedAt = rand(0, 1);
        
        if ($shouldHaveCompletedAt) {
            return now()->subDays(rand(1, 30))->format('Y-m-d H:i:s');
        }
        
        return null;
    }

    private function getRandomDuration(): int
    {
        $durations = [15, 30, 45, 60];
        return $durations[array_rand($durations)];
    }
}





