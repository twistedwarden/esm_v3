<?php

namespace App\Services;

use App\Models\PartnerSchoolApplication;
use App\Models\School;
use Illuminate\Support\Facades\Log;

class PartnerSchoolVerificationService
{
    /**
     * Check if application is ready for approval
     */
    public function isReadyForApproval(PartnerSchoolApplication $application): bool
    {
        if ($application->status !== 'under_review') {
            return false;
        }

        return $application->allDocumentsVerified();
    }

    /**
     * Update school verification status based on application
     */
    public function updateSchoolVerificationStatus(PartnerSchoolApplication $application): void
    {
        if (!$application->school_id) {
            return;
        }

        $school = $application->school;

        switch ($application->status) {
            case 'submitted':
            case 'under_review':
                $school->update(['verification_status' => 'pending']);
                break;
            case 'approved':
                $school->update([
                    'verification_status' => 'verified',
                    'is_partner_school' => true,
                    'is_active' => true,
                    'verification_date' => now(),
                    'verification_expiry_date' => now()->addYear(),
                ]);
                break;
            case 'rejected':
                $school->update(['verification_status' => 'rejected']);
                break;
        }

        Log::info('School verification status updated', [
            'school_id' => $school->id,
            'status' => $school->verification_status
        ]);
    }

    /**
     * Send notification when application status changes
     */
    public function sendStatusNotification(PartnerSchoolApplication $application, string $status): void
    {
        // This will be implemented with PHPMailer service
        // For now, just log
        Log::info('Application status notification', [
            'application_id' => $application->id,
            'status' => $status,
            'school_email' => $application->school?->email
        ]);
    }

    /**
     * Validate application completeness
     */
    public function validateApplicationCompleteness(PartnerSchoolApplication $application): array
    {
        $issues = [];

        if (!$application->school_id) {
            $issues[] = 'School not linked to application';
        }

        $documents = $application->verificationDocuments;
        if ($documents->isEmpty()) {
            $issues[] = 'No verification documents uploaded';
        }

        $pendingDocuments = $documents->where('verification_status', 'pending')->count();
        if ($pendingDocuments > 0) {
            $issues[] = "{$pendingDocuments} document(s) pending verification";
        }

        return [
            'is_complete' => empty($issues),
            'issues' => $issues
        ];
    }
}
