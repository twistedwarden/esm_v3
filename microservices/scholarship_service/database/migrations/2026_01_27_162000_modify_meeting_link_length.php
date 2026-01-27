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
        // Change meeting_link from VARCHAR(255) to TEXT to support long URLs
        DB::statement('ALTER TABLE interview_schedules MODIFY meeting_link TEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to VARCHAR(255)
        // Warning: This might truncate data if used in production with long links
        DB::statement('ALTER TABLE interview_schedules MODIFY meeting_link VARCHAR(255) NULL');
    }
};
