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
        // Ensure all SSC roles are included in the role enum
        // This migration ensures the database has the most up-to-date role values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep','ssc','ssc_city_council','ssc_budget_dept','ssc_education_affairs') DEFAULT 'citizen'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to basic roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep') DEFAULT 'citizen'");
    }
};
