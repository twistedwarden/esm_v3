<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a registry table to track school-specific tables
        Schema::create('school_data_tables_registry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->string('table_name'); // e.g., 'school_14_student_data'
            $table->string('table_type'); // 'student_data', 'academic_records', etc.
            $table->json('table_schema'); // Store the table structure
            $table->timestamp('created_at')->nullable();
            $table->timestamp('last_updated_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->unique(['school_id', 'table_type']);
            $table->index('school_id');
        });
        
        // Create a method to generate school-specific tables
        $this->createSchoolSpecificTables();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop all school-specific tables first
        $this->dropAllSchoolSpecificTables();
        
        // Drop the registry table
        Schema::dropIfExists('school_data_tables_registry');
    }
    
    /**
     * Create school-specific tables for existing schools
     */
    private function createSchoolSpecificTables(): void
    {
        $schools = DB::table('schools')->where('is_partner_school', true)->get();
        
        foreach ($schools as $school) {
            $this->createSchoolTable($school->id, $school->name);
        }
    }
    
    /**
     * Create a school-specific table
     */
    private function createSchoolTable(int $schoolId, string $schoolName): void
    {
        $tableName = "school_{$schoolId}_student_data";
        
        // Create the student data table for this school
        Schema::create($tableName, function (Blueprint $table) {
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
            $table->string('upload_batch_id')->nullable(); // To group records from same upload
            $table->string('original_filename')->nullable();
            $table->timestamp('uploaded_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['student_id_number']);
            $table->index(['upload_batch_id']);
            $table->index(['is_currently_enrolled']);
        });
        
        // Register this table in the registry
        DB::table('school_data_tables_registry')->insert([
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
        ]);
    }
    
    /**
     * Drop all school-specific tables
     */
    private function dropAllSchoolSpecificTables(): void
    {
        $tables = DB::table('school_data_tables_registry')->get();
        
        foreach ($tables as $table) {
            Schema::dropIfExists($table->table_name);
        }
    }
};
