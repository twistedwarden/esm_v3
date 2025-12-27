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
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->foreignId('enrollment_verification_id')->nullable()->constrained('enrollment_verifications')->onDelete('set null');
            $table->foreignId('interview_schedule_id')->nullable()->constrained('interview_schedules')->onDelete('set null');
            $table->timestamp('enrollment_verified_at')->nullable();
            $table->timestamp('interview_completed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->dropForeign(['enrollment_verification_id']);
            $table->dropForeign(['interview_schedule_id']);
            $table->dropColumn([
                'enrollment_verification_id',
                'interview_schedule_id',
                'enrollment_verified_at',
                'interview_completed_at'
            ]);
        });
    }
};








