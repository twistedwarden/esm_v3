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
        // Update ssc_reviews table to support parallel workflow
        Schema::table('ssc_reviews', function (Blueprint $table) {
            // Add new columns for parallel workflow (review_data already exists)
            $table->timestamp('approved_at')->nullable()->after('reviewed_at'); // When this specific stage was approved
            $table->string('approval_notes')->nullable()->after('approved_at'); // Notes for this stage approval
            $table->boolean('is_required')->default(true)->after('approval_notes'); // Whether this stage is required for final approval
        });

        // Update scholarship_applications table to support parallel workflow
        Schema::table('scholarship_applications', function (Blueprint $table) {
            // Add columns to track parallel stage completion
            $table->json('ssc_stage_status')->nullable()->after('status'); // Track which stages are completed
            $table->boolean('all_required_stages_completed')->default(false)->after('ssc_stage_status'); // Whether all required stages are done
            $table->timestamp('ready_for_final_approval_at')->nullable()->after('all_required_stages_completed'); // When ready for chairperson
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ssc_reviews', function (Blueprint $table) {
            $table->dropColumn(['review_data', 'approved_at', 'approval_notes', 'is_required']);
        });

        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->dropColumn(['ssc_stage_status', 'all_required_stages_completed', 'ready_for_final_approval_at']);
        });
    }
};