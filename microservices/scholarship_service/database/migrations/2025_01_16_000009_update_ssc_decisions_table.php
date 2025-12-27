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
        Schema::table('ssc_decisions', function (Blueprint $table) {
            $table->string('review_stage')->default('final_approval')->after('decision');
            $table->json('all_reviews_data')->nullable()->after('notes'); // summary of all stage reviews
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ssc_decisions', function (Blueprint $table) {
            $table->dropColumn(['review_stage', 'all_reviews_data']);
        });
    }
};
