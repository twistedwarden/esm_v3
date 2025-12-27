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
        Schema::create('file_security_logs', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->bigInteger('file_size');
            $table->boolean('is_clean');
            $table->string('threat_name')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('scan_duration', 8, 4); // in seconds
            $table->string('scanner_type')->default('file_security');
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('application_id')->nullable();
            $table->unsignedBigInteger('document_id')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['is_clean', 'created_at']);
            $table->index(['threat_name', 'created_at']);
            $table->index(['student_id', 'created_at']);
            $table->index(['scanner_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_security_logs');
    }
};
