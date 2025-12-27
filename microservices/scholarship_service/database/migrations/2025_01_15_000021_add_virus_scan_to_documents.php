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
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('virus_scan_log_id')->nullable()->after('verified_at');
            $table->foreign('virus_scan_log_id')->references('id')->on('virus_scan_logs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['virus_scan_log_id']);
            $table->dropColumn('virus_scan_log_id');
        });
    }
};
