<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partner_school_enrollment_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('student_id_number');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('enrollment_year');
            $table->string('enrollment_term');
            $table->boolean('is_currently_enrolled')->default(true);
            $table->date('enrollment_date')->nullable();
            $table->string('program')->nullable();
            $table->string('year_level')->nullable();
            $table->string('uploaded_by')->nullable(); // citizen_id of the uploader
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps(); // This adds created_at and updated_at columns
            
            // Indexes for performance
            $table->index(['school_id', 'student_id_number'], 'psed_school_student_idx');
            $table->index(['school_id', 'enrollment_year', 'enrollment_term'], 'psed_school_year_term_idx');
            $table->index(['is_currently_enrolled'], 'psed_enrolled_idx');
            
            // Unique constraint to prevent duplicate enrollments
            $table->unique(['school_id', 'student_id_number', 'enrollment_year', 'enrollment_term'], 'unique_enrollment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_enrollment_data');
    }
};
