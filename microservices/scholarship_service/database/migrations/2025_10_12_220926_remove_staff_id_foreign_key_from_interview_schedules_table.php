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
        Schema::table('interview_schedules', function (Blueprint $table) {
            // Drop the foreign key constraint on staff_id
            $table->dropForeign(['staff_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interview_schedules', function (Blueprint $table) {
            // Re-add the foreign key constraint (if needed for rollback)
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('set null');
        });
    }
};
