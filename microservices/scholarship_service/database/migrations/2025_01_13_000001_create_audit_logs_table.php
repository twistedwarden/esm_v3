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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable(); // User who performed the action
            $table->string('user_email')->nullable(); // User email for easier querying
            $table->string('user_role')->nullable(); // User role at time of action
            $table->string('action'); // Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)
            $table->string('resource_type')->nullable(); // Type of resource (User, Application, etc.)
            $table->string('resource_id')->nullable(); // ID of the affected resource
            $table->text('description'); // Human-readable description
            $table->json('old_values')->nullable(); // Previous values (for updates)
            $table->json('new_values')->nullable(); // New values (for updates/creates)
            $table->string('ip_address')->nullable(); // IP address of the user
            $table->string('user_agent')->nullable(); // User agent string
            $table->string('session_id')->nullable(); // Session ID
            $table->string('status')->default('success'); // success, failed, error
            $table->text('error_message')->nullable(); // Error message if action failed
            $table->json('metadata')->nullable(); // Additional metadata
            $table->timestamps();

            // Indexes for better performance
            $table->index(['user_id']);
            $table->index(['action']);
            $table->index(['resource_type']);
            $table->index(['created_at']);
            $table->index(['user_role']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
