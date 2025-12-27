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
        // Add specific SSC roles to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep','ssc','ssc_city_council','ssc_budget_dept','ssc_education_affairs') DEFAULT 'citizen'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove specific SSC roles from the role enum, keeping only the generic 'ssc'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','citizen','staff','ps_rep','ssc') DEFAULT 'citizen'");
    }
};
