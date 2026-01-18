<?php

namespace App\Services;

use App\Models\ArchivedRecord;
use App\Models\ArchiveCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ArchiveService
{
    /**
     * Archive a record
     *
     * @param string $type Archive type (e.g., 'scholarship_application')
     * @param int $id Original record ID
     * @param string|null $reason Reason for archiving
     * @param array|null $relatedRecords IDs of related records
     * @return array
     */
    public function archiveRecord(string $type, int $id, ?string $reason = null, ?array $relatedRecords = null): array
    {
        try {
            DB::beginTransaction();

            // Get the handler for this archive type
            $handler = $this->getHandler($type);

            if (!$handler) {
                throw new \Exception("No handler found for archive type: {$type}");
            }

            // Fetch the original record data
            $originalData = $handler->fetchRecord($id);

            if (!$originalData) {
                throw new \Exception("Record not found: {$type} #{$id}");
            }

            // Create archive record
            $archivedRecord = ArchivedRecord::create([
                'archive_type' => $type,
                'original_id' => $id,
                'archived_data' => json_encode($originalData),
                'archived_by' => Auth::id(),
                'archived_at' => now(),
                'archive_reason' => $reason,
                'related_records' => $relatedRecords ? json_encode($relatedRecords) : null,
                'can_restore' => true,
            ]);

            // Delete the original record using the handler
            $handler->deleteRecord($id);

            // Log the archive action
            $this->logArchiveAction('archive', $type, $id, $reason);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Record archived successfully',
                'archive_id' => $archivedRecord->id
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Archive failed for {$type} #{$id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to archive record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Restore an archived record
     *
     * @param int $archiveId
     * @return array
     */
    public function restoreRecord(int $archiveId): array
    {
        try {
            DB::beginTransaction();

            $archivedRecord = ArchivedRecord::find($archiveId);

            if (!$archivedRecord) {
                throw new \Exception("Archived record not found");
            }

            if (!$archivedRecord->can_restore) {
                throw new \Exception("This record cannot be restored");
            }

            // Get the handler for this archive type
            $handler = $this->getHandler($archivedRecord->archive_type);

            if (!$handler) {
                throw new \Exception("No handler found for archive type: {$archivedRecord->archive_type}");
            }

            // Restore the record using the handler
            $restoredData = json_decode($archivedRecord->archived_data, true);
            $restoredId = $handler->restoreRecord($restoredData);

            // Update archive record
            $archivedRecord->update([
                'restored_at' => now(),
                'restored_by' => Auth::id(),
                'can_restore' => false
            ]);

            // Log the restore action
            $this->logArchiveAction('restore', $archivedRecord->archive_type, $archivedRecord->original_id);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Record restored successfully',
                'restored_id' => $restoredId
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Restore failed for archive #{$archiveId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to restore record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get archived records with filters
     *
     * @param array $filters
     * @return array
     */
    public function getArchivedRecords(array $filters = []): array
    {
        try {
            $query = ArchivedRecord::query();

            // Apply filters
            if (isset($filters['archive_type'])) {
                $query->where('archive_type', $filters['archive_type']);
            }

            if (isset($filters['module'])) {
                $types = $this->getTypesByModule($filters['module']);
                $query->whereIn('archive_type', $types);
            }

            if (isset($filters['date_from'])) {
                $query->where('archived_at', '>=', $filters['date_from']);
            }

            if (isset($filters['date_to'])) {
                $query->where('archived_at', '<=', $filters['date_to']);
            }

            if (isset($filters['archived_by'])) {
                $query->where('archived_by', $filters['archived_by']);
            }

            if (isset($filters['can_restore'])) {
                $query->where('can_restore', $filters['can_restore']);
            }

            if (isset($filters['search'])) {
                $query->where('archived_data', 'like', '%' . $filters['search'] . '%');
            }

            // Pagination
            $perPage = $filters['per_page'] ?? 20;
            $records = $query->orderBy('archived_at', 'desc')->paginate($perPage);

            return [
                'success' => true,
                'data' => $records->items(),
                'pagination' => [
                    'current_page' => $records->currentPage(),
                    'per_page' => $records->perPage(),
                    'total' => $records->total(),
                    'last_page' => $records->lastPage()
                ]
            ];

        } catch (\Exception $e) {
            Log::error("Failed to fetch archived records", [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to fetch archived records: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Permanently delete an archived record
     *
     * @param int $archiveId
     * @return array
     */
    public function permanentlyDelete(int $archiveId): array
    {
        try {
            $archivedRecord = ArchivedRecord::find($archiveId);

            if (!$archivedRecord) {
                throw new \Exception("Archived record not found");
            }

            // Log before deletion
            $this->logArchiveAction('permanent_delete', $archivedRecord->archive_type, $archivedRecord->original_id);

            $archivedRecord->delete();

            return [
                'success' => true,
                'message' => 'Record permanently deleted'
            ];

        } catch (\Exception $e) {
            Log::error("Permanent delete failed for archive #{$archiveId}", [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to permanently delete record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Bulk archive records
     *
     * @param string $type
     * @param array $ids
     * @param string|null $reason
     * @return array
     */
    public function bulkArchive(string $type, array $ids, ?string $reason = null): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($ids as $id) {
            $result = $this->archiveRecord($type, $id, $reason);

            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'id' => $id,
                    'error' => $result['message']
                ];
            }
        }

        return [
            'success' => true,
            'message' => "Archived {$results['success']} records, {$results['failed']} failed",
            'details' => $results
        ];
    }

    /**
     * Get archive handler for a specific type
     *
     * @param string $type
     * @return mixed
     */
    private function getHandler(string $type)
    {
        $handlers = [
            'scholarship_application' => new \App\Services\Archive\ArchiveApplicationHandler(),
            'scholarship_program' => new \App\Services\Archive\ArchiveProgramHandler(),
            'ssc_review' => new \App\Services\Archive\ArchiveSSCReviewHandler(),
            'interview_schedule' => new \App\Services\Archive\ArchiveInterviewHandler(),
            'disbursement' => new \App\Services\Archive\ArchiveDisbursementHandler(),
            'student' => new \App\Services\Archive\ArchiveStudentHandler(),
            'academic_record' => new \App\Services\Archive\ArchiveAcademicRecordHandler(),
            'school' => new \App\Services\Archive\ArchiveSchoolHandler(),
            'monitoring_record' => new \App\Services\Archive\ArchiveMonitoringRecordHandler(),
        ];

        return $handlers[$type] ?? null;
    }

    /**
     * Get archive types by module
     *
     * @param string $module
     * @return array
     */
    private function getTypesByModule(string $module): array
    {
        $moduleTypes = [
            'scholarship' => ['scholarship_application', 'scholarship_program', 'ssc_review', 'interview_schedule'],
            'school_aid' => ['disbursement'],
            'student_registry' => ['student', 'academic_record'],
            'partner_school' => ['school', 'school_application', 'school_document'],
            'education_monitoring' => ['monitoring_record', 'enrollment_record']
        ];

        return $moduleTypes[$module] ?? [];
    }

    /**
     * Log archive action
     *
     * @param string $action
     * @param string $type
     * @param int $id
     * @param string|null $reason
     */
    private function logArchiveAction(string $action, string $type, int $id, ?string $reason = null): void
    {
        Log::info("Archive action: {$action}", [
            'type' => $type,
            'id' => $id,
            'user_id' => Auth::id(),
            'reason' => $reason,
            'timestamp' => now()
        ]);

        // TODO: Add to audit log table if needed
    }
}
