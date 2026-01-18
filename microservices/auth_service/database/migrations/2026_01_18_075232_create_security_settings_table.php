<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('security_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 100)->unique()->index();
            $table->string('setting_value', 255);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        // Insert default security settings
        DB::table('security_settings')->insert([
            [
                'setting_key' => 'login_warning_threshold',
                'setting_value' => '5',
                'description' => 'Number of failed login attempts before showing warning',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'login_lockout_threshold',
                'setting_value' => '7',
                'description' => 'Number of failed login attempts before account lockout',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'login_lockout_duration',
                'setting_value' => '120',
                'description' => 'Account lockout duration in seconds (default: 2 minutes)',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'login_attempt_window',
                'setting_value' => '900',
                'description' => 'Time window for counting failed attempts in seconds (default: 15 minutes)',
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
        Schema::dropIfExists('security_settings');
    }
};
