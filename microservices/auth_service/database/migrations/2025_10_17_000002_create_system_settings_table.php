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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        // Insert default settings
        DB::table('system_settings')->insert([
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'description' => 'Enable or disable maintenance mode',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'registration_enabled',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Enable or disable user registration',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'email_verification_required',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Require email verification for new users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'max_file_upload_size',
                'value' => '10485760',
                'type' => 'integer',
                'description' => 'Maximum file upload size in bytes',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'session_timeout',
                'value' => '120',
                'type' => 'integer',
                'description' => 'Session timeout in minutes',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'password_min_length',
                'value' => '8',
                'type' => 'integer',
                'description' => 'Minimum password length',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'require_strong_password',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Require strong password with special characters',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'backup_frequency',
                'value' => 'daily',
                'type' => 'string',
                'description' => 'Backup frequency: daily, weekly, monthly',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'log_retention_days',
                'value' => '90',
                'type' => 'integer',
                'description' => 'Number of days to retain logs',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'notification_batch_size',
                'value' => '100',
                'type' => 'integer',
                'description' => 'Number of notifications to process in a batch',
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
        Schema::dropIfExists('system_settings');
    }
};

