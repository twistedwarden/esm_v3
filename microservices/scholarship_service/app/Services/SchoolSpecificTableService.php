<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SchoolSpecificTableService
{
    /**
     * Get or create school-specific table name
     */
    public function getSchoolTableName(int $schoolId, string $tableType = 'student_data'): string
    {
        return "school_{$schoolId}_{$tableType}";
    }

    /**
     * Ensure school-specific table exists
     */
    public function ensureSchoolTableExists(int $schoolId, string $schoolName): string
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        // Check if table already exists
        if (Schema::hasTable($tableName)) {
            return $tableName;
        }
        
        // Create the table
        $this->createSchoolTable($schoolId, $schoolName);
        
        return $tableName;
    }

    /**
     * Create school-specific table
     */
    public function createSchoolTable(int $schoolId, string $schoolName): void
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        Schema::create($tableName, function ($table) {
            $table->id();
            $table->string('student_id_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('extension_name')->nullable();
            $table->string('citizen_id')->nullable();
            $table->enum('sex', ['Male', 'Female'])->default('Male');
            $table->string('civil_status')->default('Single');
            $table->string('nationality')->default('Filipino');
            $table->string('birth_place')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email_address')->nullable();
            $table->boolean('is_currently_enrolled')->default(true);
            $table->boolean('is_graduating')->default(false);
            
            // Academic information
            $table->enum('educational_level', [
                'ELEMENTARY',
                'HIGH SCHOOL', 
                'SENIOR HIGH SCHOOL',
                'TERTIARY/COLLEGE',
                'GRADUATE SCHOOL'
            ])->default('TERTIARY/COLLEGE');
            $table->string('program')->nullable();
            $table->string('major')->nullable();
            $table->string('year_level')->nullable();
            $table->string('school_year')->nullable();
            $table->string('school_term')->nullable();
            $table->integer('units_enrolled')->nullable();
            $table->decimal('gpa', 3, 2)->nullable();
            $table->date('enrollment_date')->nullable();
            $table->date('graduation_date')->nullable();
            
            // File upload tracking
            $table->string('upload_batch_id')->nullable();
            $table->string('original_filename')->nullable();
            $table->timestamp('uploaded_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['student_id_number']);
            $table->index(['upload_batch_id']);
            $table->index(['is_currently_enrolled']);
        });
        
        // Register the table
        $this->registerSchoolTable($schoolId, $tableName);
    }

    /**
     * Register school table in registry
     */
    private function registerSchoolTable(int $schoolId, string $tableName): void
    {
        DB::table('school_data_tables_registry')->updateOrInsert(
            ['school_id' => $schoolId, 'table_type' => 'student_data'],
            [
                'school_id' => $schoolId,
                'table_name' => $tableName,
                'table_type' => 'student_data',
                'table_schema' => json_encode([
                    'columns' => [
                        'student_id_number', 'first_name', 'last_name', 'middle_name',
                        'extension_name', 'citizen_id', 'sex', 'civil_status', 'nationality',
                        'birth_place', 'birth_date', 'contact_number', 'email_address',
                        'is_currently_enrolled', 'is_graduating', 'educational_level',
                        'program', 'major', 'year_level', 'school_year', 'school_term',
                        'units_enrolled', 'gpa', 'enrollment_date', 'graduation_date'
                    ]
                ]),
                'created_at' => now(),
                'last_updated_at' => now(),
                'is_active' => true
            ]
        );
    }

    /**
     * Insert data into school-specific table
     */
    public function insertSchoolData(int $schoolId, array $data, string $batchId = null, string $filename = null): int
    {
        $tableName = $this->ensureSchoolTableExists($schoolId, 'School ' . $schoolId);
        
        $insertData = array_merge($data, [
            'upload_batch_id' => $batchId ?? Str::uuid(),
            'original_filename' => $filename,
            'uploaded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return DB::table($tableName)->insertGetId($insertData);
    }

    /**
     * Get data from school-specific table
     */
    public function getSchoolData(int $schoolId, int $perPage = 15, string $search = null, string $status = 'all')
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        if (!Schema::hasTable($tableName)) {
            return collect([]);
        }
        
        $query = DB::table($tableName);
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id_number', 'like', "%{$search}%")
                  ->orWhere('email_address', 'like', "%{$search}%");
            });
        }
        
        if ($status === 'enrolled') {
            $query->where('is_currently_enrolled', true);
        }
        
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get school data statistics
     */
    public function getSchoolDataStats(int $schoolId): array
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        if (!Schema::hasTable($tableName)) {
            return [
                'total_students' => 0,
                'enrolled_students' => 0,
                'recent_uploads' => 0,
                'upload_batches' => 0
            ];
        }
        
        $totalStudents = DB::table($tableName)->count();
        $enrolledStudents = DB::table($tableName)->where('is_currently_enrolled', true)->count();
        $recentUploads = DB::table($tableName)->where('uploaded_at', '>=', now()->subDays(7))->count();
        $uploadBatches = DB::table($tableName)->distinct('upload_batch_id')->count('upload_batch_id');
        
        return [
            'total_students' => $totalStudents,
            'enrolled_students' => $enrolledStudents,
            'recent_uploads' => $recentUploads,
            'upload_batches' => $uploadBatches
        ];
    }

    /**
     * Get all upload batches for a school
     */
    public function getSchoolUploadBatches(int $schoolId): array
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        if (!Schema::hasTable($tableName)) {
            return [];
        }
        
        return DB::table($tableName)
            ->select('upload_batch_id', 'original_filename', 'uploaded_at', DB::raw('COUNT(*) as record_count'))
            ->groupBy('upload_batch_id', 'original_filename', 'uploaded_at')
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Delete a specific upload batch
     */
    public function deleteUploadBatch(int $schoolId, string $batchId): int
    {
        $tableName = $this->getSchoolTableName($schoolId);
        
        if (!Schema::hasTable($tableName)) {
            return 0;
        }
        
        return DB::table($tableName)->where('upload_batch_id', $batchId)->delete();
    }
}
