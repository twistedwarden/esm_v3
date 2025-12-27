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
        Schema::create('document_quarantine', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->string('original_file_path');
            $table->string('quarantine_file_path');
            $table->string('threat_name')->nullable();
            $table->text('scan_details')->nullable();
            $table->string('quarantine_reason');
            $table->timestamp('quarantined_at');
            $table->unsignedBigInteger('quarantined_by')->nullable();
            $table->boolean('is_reviewed')->default(false);
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->string('action_taken')->nullable(); // 'deleted', 'restored', 'false_positive'
            $table->timestamps();

            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            // Note: quarantined_by and reviewed_by foreign keys removed to avoid constraint issues
            // These will reference user IDs but without foreign key constraints
            
            $table->index(['quarantined_at', 'is_reviewed']);
            $table->index('threat_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_quarantine');
    }
};
