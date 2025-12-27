<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This creates a new unified table alongside existing school-specific tables
     */
    public function up(): void
    {
        // Create the new unified table with partitioning
        Schema::create('unified_school_student_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            
            // Student identification
            $table->string('student_id_number');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('extension_name')->nullable();
            $table->string('citizen_id')->nullable();
            
            // Personal information
            $table->enum('sex', ['Male', 'Female'])->default('Male');
            $table->string('civil_status')->default('Single');
            $table->string('nationality')->default('Filipino');
            $table->string('birth_place')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email_address')->nullable();
            
            // Enrollment status
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
            
            // Upload tracking
            $table->string('upload_batch_id')->nullable();
            $table->string('original_filename')->nullable();
            $table->timestamp('uploaded_at')->nullable();
            
            $table->timestamps();
            
            // Critical indexes for performance
            $table->unique(['school_id', 'student_id_number']);
            $table->index(['school_id', 'is_currently_enrolled'], 'idx_school_enrolled');
            $table->index(['school_id', 'upload_batch_id'], 'idx_school_batch');
            $table->index(['school_id', 'created_at'], 'idx_school_created');
            $table->index(['school_id', 'first_name', 'last_name'], 'idx_school_search');
        });

        // Add partitioning by school_id for better performance
        try {
            DB::statement("
                ALTER TABLE unified_school_student_data 
                PARTITION BY HASH(school_id) 
                PARTITIONS 16
            ");
        } catch (\Exception $e) {
            // If partitioning fails, continue without it
            \Log::warning('Failed to create partitions for unified_school_student_data: ' . $e->getMessage());
        }

        // Migrate existing data from school-specific tables
        $this->migrateExistingData();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unified_school_student_data');
    }

    /**
     * Migrate existing data from school-specific tables to unified table
     */
    private function migrateExistingData(): void
    {
        try {
            // Get all school-specific tables from registry
            $schoolTables = DB::table('school_data_tables_registry')
                ->where('table_type', 'student_data')
                ->where('is_active', true)
                ->get();

            foreach ($schoolTables as $tableInfo) {
                $schoolId = $tableInfo->school_id;
                $tableName = $tableInfo->table_name;

                // Check if the table exists
                if (!Schema::hasTable($tableName)) {
                    \Log::warning("School table {$tableName} does not exist, skipping migration");
                    continue;
                }

                // Get all data from school-specific table
                $schoolData = DB::table($tableName)->get();

                \Log::info("Migrating data from {$tableName} to unified table", [
                    'school_id' => $schoolId,
                    'record_count' => $schoolData->count()
                ]);

                // Insert data into unified table
                foreach ($schoolData as $record) {
                    $recordArray = (array) $record;
                    $recordArray['school_id'] = $schoolId; // Add school_id
                    
                    // Remove the id field to let auto-increment handle it
                    unset($recordArray['id']);
                    
                    DB::table('unified_school_student_data')->insert($recordArray);
                }

                \Log::info("Successfully migrated {$schoolData->count()} records for school {$schoolId}");
            }

            \Log::info("Data migration completed successfully");
        } catch (\Exception $e) {
            \Log::error("Failed to migrate existing data: " . $e->getMessage());
            throw $e;
        }
    }
};
