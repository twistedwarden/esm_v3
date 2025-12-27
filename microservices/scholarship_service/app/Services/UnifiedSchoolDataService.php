<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UnifiedSchoolDataService
{
    protected $useUnifiedTable = true;

    public function __construct()
    {
        // Always use unified table if it exists
        $this->useUnifiedTable = Schema::hasTable('unified_school_student_data');
    }

    /**
     * Insert student data for a specific school
     */
    public function insertStudentData(int $schoolId, array $data, string $batchId = null, string $filename = null): int
    {
        if ($this->useUnifiedTable) {
            return $this->insertIntoUnifiedTable($schoolId, $data, $batchId, $filename);
        } else {
            return $this->insertIntoSchoolSpecificTable($schoolId, $data, $batchId, $filename);
        }
    }

    /**
     * Get student data for a specific school
     */
    public function getSchoolStudentData(int $schoolId, array $options = [])
    {
        if ($this->useUnifiedTable) {
            return $this->getFromUnifiedTable($schoolId, $options);
        } else {
            return $this->getFromSchoolSpecificTable($schoolId, $options);
        }
    }

    /**
     * Get school statistics
     */
    public function getSchoolStatistics(int $schoolId): array
    {
        if ($this->useUnifiedTable) {
            return $this->getStatsFromUnifiedTable($schoolId);
        } else {
            return $this->getStatsFromSchoolSpecificTable($schoolId);
        }
    }

    /**
     * Get upload batches for a school
     */
    public function getUploadBatches(int $schoolId): array
    {
        if ($this->useUnifiedTable) {
            return $this->getBatchesFromUnifiedTable($schoolId);
        } else {
            return $this->getBatchesFromSchoolSpecificTable($schoolId);
        }
    }

    /**
     * Delete an upload batch
     */
    public function deleteUploadBatch(int $schoolId, string $batchId): int
    {
        if ($this->useUnifiedTable) {
            return $this->deleteBatchFromUnifiedTable($schoolId, $batchId);
        } else {
            return $this->deleteBatchFromSchoolSpecificTable($schoolId, $batchId);
        }
    }

    // Unified Table Methods
    private function insertIntoUnifiedTable(int $schoolId, array $data, string $batchId = null, string $filename = null): int
    {
        // Handle additional_data field
        $additionalData = $data['additional_data'] ?? null;
        unset($data['additional_data']); // Remove from main data array
        
        $insertData = array_merge($data, [
            'school_id' => $schoolId,
            'upload_batch_id' => $batchId ?? Str::uuid(),
            'original_filename' => $filename,
            'uploaded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Add additional_data as JSON if present
        if ($additionalData) {
            $insertData['additional_data'] = json_encode($additionalData);
        }
        
        return DB::table('unified_school_student_data')->insertGetId($insertData);
    }

    private function getFromUnifiedTable(int $schoolId, array $options = [])
    {
        $perPage = $options['per_page'] ?? 15;
        $search = $options['search'] ?? null;
        $status = $options['status'] ?? 'all';
        
        $query = DB::table('unified_school_student_data')
            ->where('school_id', $schoolId);
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id_number', 'like', "%{$search}%")
                  ->orWhere('email_address', 'like', "%{$search}%");
            });
        }
        
        if ($status === 'enrolled') {
            $query->where('is_currently_enrolled', 'enrolled');
        }
        
        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Decode additional_data for each record
        $results->getCollection()->transform(function ($item) {
            if ($item->additional_data) {
                $item->additional_data = json_decode($item->additional_data, true);
            }
            return $item;
        });
        
        return $results;
    }

    private function getStatsFromUnifiedTable(int $schoolId): array
    {
        $baseQuery = DB::table('unified_school_student_data')->where('school_id', $schoolId);
        
        return [
            'total_students' => $baseQuery->count(),
            'enrolled_students' => (clone $baseQuery)->where('is_currently_enrolled', 'enrolled')->count(),
            'graduating_students' => (clone $baseQuery)->where('is_graduating', true)->count(),
            'recent_uploads' => (clone $baseQuery)->where('uploaded_at', '>=', now()->subDays(7))->count(),
            'upload_batches' => (clone $baseQuery)->distinct('upload_batch_id')->count('upload_batch_id'),
        ];
    }

    private function getBatchesFromUnifiedTable(int $schoolId): array
    {
        return DB::table('unified_school_student_data')
            ->where('school_id', $schoolId)
            ->select('upload_batch_id', 'original_filename', 'uploaded_at', DB::raw('COUNT(*) as record_count'))
            ->groupBy('upload_batch_id', 'original_filename', 'uploaded_at')
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->toArray();
    }

    private function deleteBatchFromUnifiedTable(int $schoolId, string $batchId): int
    {
        return DB::table('unified_school_student_data')
            ->where('school_id', $schoolId)
            ->where('upload_batch_id', $batchId)
            ->delete();
    }

    // School-Specific Table Methods (Fallback)
    private function insertIntoSchoolSpecificTable(int $schoolId, array $data, string $batchId = null, string $filename = null): int
    {
        $schoolTableService = app(SchoolSpecificTableService::class);
        return $schoolTableService->insertSchoolData($schoolId, $data, $batchId, $filename);
    }

    private function getFromSchoolSpecificTable(int $schoolId, array $options = [])
    {
        $schoolTableService = app(SchoolSpecificTableService::class);
        return $schoolTableService->getSchoolData(
            $schoolId, 
            $options['per_page'] ?? 15, 
            $options['search'] ?? null, 
            $options['status'] ?? 'all'
        );
    }

    private function getStatsFromSchoolSpecificTable(int $schoolId): array
    {
        $schoolTableService = app(SchoolSpecificTableService::class);
        return $schoolTableService->getSchoolDataStats($schoolId);
    }

    private function getBatchesFromSchoolSpecificTable(int $schoolId): array
    {
        $schoolTableService = app(SchoolSpecificTableService::class);
        return $schoolTableService->getSchoolUploadBatches($schoolId);
    }

    private function deleteBatchFromSchoolSpecificTable(int $schoolId, string $batchId): int
    {
        $schoolTableService = app(SchoolSpecificTableService::class);
        return $schoolTableService->deleteUploadBatch($schoolId, $batchId);
    }

    /**
     * Check if unified table is being used
     */
    public function isUsingUnifiedTable(): bool
    {
        return $this->useUnifiedTable;
    }

    /**
     * Force switch to unified table (for testing)
     */
    public function forceUseUnifiedTable(bool $use = true): void
    {
        $this->useUnifiedTable = $use;
    }
}
