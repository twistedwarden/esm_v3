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
        // First, update any 'student' roles to 'citizen' to match the expected values
        DB::table('users')->where('role', 'student')->update(['role' => 'citizen']);
        
        // Then update the enum to include all valid roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'citizen', 'staff', 'ps_rep') NOT NULL DEFAULT 'citizen'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the previous enum values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'student', 'staff', 'ps_rep') NOT NULL DEFAULT 'student'");
    }
};