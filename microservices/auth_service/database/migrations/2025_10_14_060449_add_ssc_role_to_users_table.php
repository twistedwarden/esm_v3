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
        // Add 'ssc' to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep','ssc') DEFAULT 'citizen'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'ssc' from the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep') DEFAULT 'citizen'");
    }
};