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
        // Add all SSC roles including ssc_chairperson to the role enum
        // This ensures all SSC member types can be created in user management
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin',
            'citizen',
            'staff',
            'ps_rep',
            'ssc',
            'ssc_chairperson',
            'ssc_city_council',
            'ssc_budget_dept',
            'ssc_education_affairs',
            'ssc_hrd',
            'ssc_social_services',
            'ssc_accounting',
            'ssc_treasurer',
            'ssc_qcydo',
            'ssc_planning_dept',
            'ssc_schools_division',
            'ssc_qcu'
        ) DEFAULT 'citizen'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous SSC roles without the new ones
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin',
            'citizen',
            'staff',
            'ps_rep',
            'ssc',
            'ssc_city_council',
            'ssc_budget_dept',
            'ssc_education_affairs'
        ) DEFAULT 'citizen'");
    }
};

