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
            // Add foreign key constraint for staff
            $table->foreignId('staff_id')->nullable()->constrained('staff')->onDelete('set null');
            
            // Make interviewer_name nullable since we'll use staff_id primarily
            $table->string('interviewer_name')->nullable()->change();
            
            // Update indexes
            $table->index(['staff_id', 'interview_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interview_schedules', function (Blueprint $table) {
            // Drop foreign key constraint
            $table->dropForeign(['staff_id']);
            $table->dropColumn('staff_id');
            
            // Make interviewer_name required again
            $table->string('interviewer_name')->nullable(false)->change();
            
            // Drop indexes
            $table->dropIndex(['staff_id', 'interview_date']);
        });
    }
};
