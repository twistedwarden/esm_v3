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
        // Drop the column with foreign key constraint
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('assigned_school_id');
        });
        
        // Recreate the column without foreign key constraint
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_school_id')->nullable()->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('assigned_school_id');
        });
    }
};
