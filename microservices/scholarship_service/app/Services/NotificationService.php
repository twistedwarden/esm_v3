<?php

namespace App\Services;

use App\Models\InterviewSchedule;
use App\Models\EnrollmentVerification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    protected $mailer;

    public function __construct(PhpMailerService $mailer)
    {
        $this->mailer = $mailer;
    }

    /**
     * Send application status notification
     */
    public function sendApplicationStatusNotification($application, string $status, ?string $message = null, array $additionalData = []): bool
    {
        try {
            $student = $application->student;

            // Only send if we have a student with an email
            if (!$student || !$student->email_address) {
                Log::warning('Cannot send status email: No student email found', [
                    'application_id' => $application->id
                ]);
                return false;
            }

            // Using the new generic template
            $htmlContent = view('emails.scholarship.status-update', [
                'student_name' => $student->first_name,
                'application_number' => $application->application_number,
                'status' => $status,
                'message' => $message,
                'data' => $additionalData
            ])->render();

            $subject = 'Application Status Update - ' . strtoupper(str_replace('_', ' ', $status));

            // Use the generic sendNotificationEmail method from PhpMailerService
            return $this->mailer->sendNotificationEmail(
                $student->email_address,
                $student->full_name,
                $subject,
                $htmlContent
            );

        } catch (\Exception $e) {
            Log::error('Failed to send application status notification', [
                'application_id' => $application->id,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send interview scheduled notification
     */
    public function sendInterviewScheduledNotification(InterviewSchedule $schedule): bool
    {
        try {
            $student = $schedule->student;
            $application = $schedule->application;

            // Email notification
            $this->sendInterviewScheduledEmail($student, $schedule);

            // SMS notification (placeholder)
            $this->sendInterviewScheduledSMS($student, $schedule);

            // In-app notification (placeholder)
            $this->createInAppNotification($student, 'interview_scheduled', $schedule);

            Log::info('Interview scheduled notification sent', [
                'schedule_id' => $schedule->id,
                'student_id' => $student->id,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send interview scheduled notification', [
                'schedule_id' => $schedule->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send interview reminder notification
     */
    public function sendInterviewReminderNotification(InterviewSchedule $schedule): bool
    {
        try {
            $student = $schedule->student;

            // Email reminder
            $this->sendInterviewReminderEmail($student, $schedule);

            // SMS reminder
            $this->sendInterviewReminderSMS($student, $schedule);

            Log::info('Interview reminder notification sent', [
                'schedule_id' => $schedule->id,
                'student_id' => $student->id,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send interview reminder notification', [
                'schedule_id' => $schedule->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send enrollment verification status notification
     */
    public function sendEnrollmentVerificationNotification(EnrollmentVerification $verification): bool
    {
        try {
            $student = $verification->student;
            $application = $verification->application;

            if ($verification->isVerified()) {
                $this->sendEnrollmentVerifiedEmail($student, $verification);
                $this->createInAppNotification($student, 'enrollment_verified', $verification);
            } elseif ($verification->isRejected()) {
                $this->sendEnrollmentRejectedEmail($student, $verification);
                $this->createInAppNotification($student, 'enrollment_rejected', $verification);
            }

            Log::info('Enrollment verification notification sent', [
                'verification_id' => $verification->id,
                'student_id' => $student->id,
                'status' => $verification->verification_status,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send enrollment verification notification', [
                'verification_id' => $verification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send interview scheduled email
     */
    private function sendInterviewScheduledEmail($student, InterviewSchedule $schedule): void
    {
        $data = [
            'student_name' => $student->full_name,
            'interview_date' => $schedule->interview_date,
            'interview_time' => $schedule->interview_time,
            'interview_location' => $schedule->full_location,
            'interview_type' => $schedule->interview_type,
            'meeting_link' => $schedule->meeting_link,
            'interviewer_name' => $schedule->interviewer_name,
            'application_number' => $schedule->application->application_number,
        ];

        // In a real implementation, you would send actual emails
        Log::info('Interview scheduled email would be sent', [
            'to' => $student->email_address,
            'data' => $data,
        ]);

        // Example using Laravel Mail (uncomment when mail is configured)
        /*
        Mail::send('emails.interview-scheduled', $data, function($message) use ($student) {
            $message->to($student->email_address, $student->full_name)
                   ->subject('Interview Scheduled - Scholarship Application');
        });
        */
    }

    /**
     * Send interview reminder email
     */
    private function sendInterviewReminderEmail($student, InterviewSchedule $schedule): void
    {
        $data = [
            'student_name' => $student->full_name,
            'interview_date' => $schedule->interview_date,
            'interview_time' => $schedule->interview_time,
            'interview_location' => $schedule->full_location,
            'interview_type' => $schedule->interview_type,
            'meeting_link' => $schedule->meeting_link,
            'interviewer_name' => $schedule->interviewer_name,
        ];

        Log::info('Interview reminder email would be sent', [
            'to' => $student->email_address,
            'data' => $data,
        ]);
    }

    /**
     * Send enrollment verified email
     */
    private function sendEnrollmentVerifiedEmail($student, EnrollmentVerification $verification): void
    {
        $data = [
            'student_name' => $student->full_name,
            'application_number' => $verification->application->application_number,
            'enrollment_year' => $verification->enrollment_year,
            'enrollment_term' => $verification->enrollment_term,
        ];

        Log::info('Enrollment verified email would be sent', [
            'to' => $student->email_address,
            'data' => $data,
        ]);
    }

    /**
     * Send enrollment rejected email
     */
    private function sendEnrollmentRejectedEmail($student, EnrollmentVerification $verification): void
    {
        $data = [
            'student_name' => $student->full_name,
            'application_number' => $verification->application->application_number,
            'rejection_reason' => $verification->verification_notes,
        ];

        Log::info('Enrollment rejected email would be sent', [
            'to' => $student->email_address,
            'data' => $data,
        ]);
    }

    /**
     * Send interview scheduled SMS
     */
    private function sendInterviewScheduledSMS($student, InterviewSchedule $schedule): void
    {
        $message = "Hi {$student->first_name}! Your scholarship interview is scheduled for {$schedule->formatted_date_time}. Location: {$schedule->full_location}. Good luck!";

        Log::info('Interview scheduled SMS would be sent', [
            'to' => $student->contact_number,
            'message' => $message,
        ]);
    }

    /**
     * Send interview reminder SMS
     */
    private function sendInterviewReminderSMS($student, InterviewSchedule $schedule): void
    {
        $message = "Reminder: Your scholarship interview is tomorrow at {$schedule->interview_time}. Location: {$schedule->full_location}";

        Log::info('Interview reminder SMS would be sent', [
            'to' => $student->contact_number,
            'message' => $message,
        ]);
    }

    /**
     * Create in-app notification
     */
    private function createInAppNotification($student, $type, $relatedModel): void
    {
        $notificationData = [
            'student_id' => $student->id,
            'type' => $type,
            'title' => $this->getNotificationTitle($type),
            'message' => $this->getNotificationMessage($type, $relatedModel),
            'related_model_type' => get_class($relatedModel),
            'related_model_id' => $relatedModel->id,
            'created_at' => now(),
        ];

        Log::info('In-app notification would be created', $notificationData);
    }

    /**
     * Get notification title based on type
     */
    private function getNotificationTitle($type): string
    {
        switch ($type) {
            case 'interview_scheduled':
                return 'Interview Scheduled';
            case 'enrollment_verified':
                return 'Enrollment Verified';
            case 'enrollment_rejected':
                return 'Enrollment Verification Failed';
            default:
                return 'Notification';
        }
    }

    /**
     * Get notification message based on type and model
     */
    private function getNotificationMessage($type, $model): string
    {
        switch ($type) {
            case 'interview_scheduled':
                return "Your scholarship interview has been scheduled for {$model->formatted_date_time}.";
            case 'enrollment_verified':
                return "Your enrollment verification has been approved. You can now proceed to the interview stage.";
            case 'enrollment_rejected':
                return "Your enrollment verification was not approved. Please check the requirements and resubmit.";
            default:
                return 'You have a new notification.';
        }
    }

    /**
     * Send bulk notifications for scheduled interviews
     */
    public function sendBulkInterviewReminders(): int
    {
        $tomorrow = now()->addDay()->format('Y-m-d');

        $schedules = InterviewSchedule::where('interview_date', $tomorrow)
            ->where('status', 'scheduled')
            ->with(['student', 'application'])
            ->get();

        $sentCount = 0;

        foreach ($schedules as $schedule) {
            if ($this->sendInterviewReminderNotification($schedule)) {
                $sentCount++;
            }
        }

        Log::info('Bulk interview reminders sent', [
            'total_schedules' => $schedules->count(),
            'sent_count' => $sentCount,
        ]);

        return $sentCount;
    }
}





