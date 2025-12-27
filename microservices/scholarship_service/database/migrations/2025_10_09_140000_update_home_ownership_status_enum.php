<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the enum values for home_ownership_status
        DB::statement("ALTER TABLE financial_information MODIFY COLUMN home_ownership_status ENUM('owned', 'rented', 'living_with_relatives', 'boarding_house', 'informal_settlers', 'others') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE financial_information MODIFY COLUMN home_ownership_status ENUM('owned', 'rented', 'borrowed', 'other') NULL");
    }
};
