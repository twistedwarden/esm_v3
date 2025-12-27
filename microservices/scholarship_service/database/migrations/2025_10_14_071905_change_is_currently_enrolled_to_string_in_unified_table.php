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
        Schema::table('unified_school_student_data', function (Blueprint $table) {
            $table->string('is_currently_enrolled')->default('enrolled')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unified_school_student_data', function (Blueprint $table) {
            $table->boolean('is_currently_enrolled')->default(true)->change();
        });
    }
};
