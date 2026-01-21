<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert OTP enabled setting
        DB::table('security_settings')->insert([
            'setting_key' => 'otp_enabled',
            'setting_value' => 'true',
            'description' => 'Enable or disable OTP authentication for login',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('security_settings')->where('setting_key', 'otp_enabled')->delete();
    }
};
