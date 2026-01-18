<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Unified archive metadata table
        Schema::create('archived_records', function (Blueprint $table) {
            $table->id();
            $table->enum('archive_type', [
                'scholarship_application',
                'scholarship_program',
                'ssc_review',
                'interview_schedule',
                'disbursement',
                'student',
                'academic_record',
                'school',
                'monitoring_record',
                'enrollment_record',
                'school_application',
                'school_document'
            ])->comment('Type of archived record');
            $table->unsignedBigInteger('original_id')->comment('ID of the original record');
            $table->json('archived_data')->comment('Complete record data in JSON format');
            $table->unsignedBigInteger('archived_by')->nullable()->comment('User who archived the record');
            $table->timestamp('archived_at')->useCurrent()->comment('When the record was archived');
            $table->text('archive_reason')->nullable()->comment('Reason for archiving');
            $table->json('related_records')->nullable()->comment('IDs of related archived records');
            $table->boolean('can_restore')->default(true)->comment('Whether the record can be restored');
            $table->timestamp('restored_at')->nullable()->comment('When the record was restored');
            $table->unsignedBigInteger('restored_by')->nullable()->comment('User who restored the record');

            // Indexes
            $table->index(['archive_type', 'original_id'], 'idx_type_original');
            $table->index('archived_at', 'idx_archived_at');
            $table->index('archived_by', 'idx_archived_by');
            $table->index('can_restore', 'idx_can_restore');
        });

        // Archive categories for organization
        Schema::create('archive_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->comment('Category name');
            $table->text('description')->nullable()->comment('Category description');
            $table->string('module', 50)->comment('Module this category belongs to');
            $table->timestamps();

            $table->unique(['name', 'module'], 'unique_category_module');
        });

        // Insert default categories
        DB::table('archive_categories')->insert([
            [
                'name' => 'Scholarship Applications',
                'description' => 'Archived scholarship applications',
                'module' => 'scholarship',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Scholarship Programs',
                'description' => 'Archived scholarship programs',
                'module' => 'scholarship',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'SSC Reviews',
                'description' => 'Archived SSC review records',
                'module' => 'scholarship',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Interview Schedules',
                'description' => 'Archived interview schedules',
                'module' => 'scholarship',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Disbursements',
                'description' => 'Archived disbursement records',
                'module' => 'school_aid',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Students',
                'description' => 'Archived student records',
                'module' => 'student_registry',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Academic Records',
                'description' => 'Archived academic records',
                'module' => 'student_registry',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Schools',
                'description' => 'Archived school records',
                'module' => 'partner_school',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Monitoring Records',
                'description' => 'Archived monitoring records',
                'module' => 'education_monitoring',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archive_categories');
        Schema::dropIfExists('archived_records');
    }
};
