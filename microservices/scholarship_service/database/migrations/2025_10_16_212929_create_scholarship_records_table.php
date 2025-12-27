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
        if (!Schema::hasTable('scholarship_records')) {
            Schema::create('scholarship_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
                $table->string('scholarship_type');
                $table->string('subcategory')->nullable();
                $table->decimal('approved_amount', 10, 2);
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->enum('status', ['active', 'completed', 'suspended', 'terminated'])->default('active');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->text('notes')->nullable();
                $table->json('disbursement_records')->nullable();
                $table->json('academic_requirements')->nullable();
                $table->json('renewal_requirements')->nullable();
                $table->timestamps();
                
                // Indexes
                $table->index(['student_id', 'status']);
                $table->index(['application_id']);
                $table->index(['scholarship_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scholarship_records');
    }
};
