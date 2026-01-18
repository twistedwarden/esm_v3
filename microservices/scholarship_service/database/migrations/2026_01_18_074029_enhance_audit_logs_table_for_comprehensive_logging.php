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
        Schema::table('audit_logs', function (Blueprint $table) {
            // Request details
            $table->string('request_method', 10)->nullable()->after('action')->comment('HTTP method (GET, POST, etc.)');
            $table->text('request_url')->nullable()->after('request_method')->comment('Full request URL');
            $table->json('request_body')->nullable()->after('request_url')->comment('Request payload (sanitized)');
            $table->json('request_params')->nullable()->after('request_body')->comment('Query parameters');

            // Response details
            $table->integer('response_status')->nullable()->after('request_params')->comment('HTTP response status code');
            $table->integer('response_time_ms')->nullable()->after('response_status')->comment('Response time in milliseconds');

            // Enhanced tracking
            $table->json('before_data')->nullable()->after('old_values')->comment('Data before change (for updates)');
            $table->json('after_data')->nullable()->after('before_data')->comment('Data after change (for updates)');
            $table->string('error_message')->nullable()->after('status')->comment('Error message if action failed');
        });

        // Add indexes for better query performance
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('user_id', 'idx_audit_user_id');
            $table->index('created_at', 'idx_audit_created_at');
            $table->index('action', 'idx_audit_action');
            $table->index('resource_type', 'idx_audit_resource_type');
            $table->index('session_id', 'idx_audit_session_id');
            $table->index('status', 'idx_audit_status');
            $table->index(['user_id', 'created_at'], 'idx_audit_user_date');
            $table->index(['resource_type', 'resource_id'], 'idx_audit_resource');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_audit_user_id');
            $table->dropIndex('idx_audit_created_at');
            $table->dropIndex('idx_audit_action');
            $table->dropIndex('idx_audit_resource_type');
            $table->dropIndex('idx_audit_session_id');
            $table->dropIndex('idx_audit_status');
            $table->dropIndex('idx_audit_user_date');
            $table->dropIndex('idx_audit_resource');

            // Drop columns
            $table->dropColumn([
                'request_method',
                'request_url',
                'request_body',
                'request_params',
                'response_status',
                'response_time_ms',
                'before_data',
                'after_data',
                'error_message'
            ]);
        });
    }
};
