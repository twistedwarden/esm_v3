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
        Schema::table('aid_disbursements', function (Blueprint $table) {
            // Make receipt_path nullable since we generate it after creating the disbursement
            $table->string('receipt_path', 500)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            // Revert to NOT NULL (but this might fail if there are NULL values)
            $table->string('receipt_path', 500)->nullable(false)->change();
        });
    }
};
