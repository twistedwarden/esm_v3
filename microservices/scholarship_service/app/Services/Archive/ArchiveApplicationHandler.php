<?php

namespace App\Services\Archive;

use App\Models\ScholarshipApplication;
use Illuminate\Support\Facades\DB;

class ArchiveApplicationHandler implements ArchiveHandlerInterface
{
    public function fetchRecord(int $id): ?array
    {
        $application = ScholarshipApplication::with([
            'student',
            'scholarshipProgram',
            'documents',
            'sscReviews',
            'interviewSchedules'
        ])->find($id);

        if (!$application) {
            return null;
        }

        return $application->toArray();
    }

    public function deleteRecord(int $id): bool
    {
        $application = ScholarshipApplication::find($id);

        if (!$application) {
            return false;
        }

        // Soft delete or hard delete based on your needs
        return $application->delete();
    }

    public function restoreRecord(array $data): int
    {
        // Remove relationships and metadata
        $cleanData = collect($data)->except([
            'student',
            'scholarship_program',
            'documents',
            'ssc_reviews',
            'interview_schedules',
            'created_at',
            'updated_at',
            'deleted_at'
        ])->toArray();

        // Create new application record
        $application = ScholarshipApplication::create($cleanData);

        return $application->id;
    }

    public function getArchiveType(): string
    {
        return 'scholarship_application';
    }
}
