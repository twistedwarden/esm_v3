<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE academic_records MODIFY COLUMN educational_level ENUM('ELEMENTARY', 'HIGH SCHOOL', 'SENIOR HIGH SCHOOL', 'TERTIARY/COLLEGE', 'GRADUATE SCHOOL', 'VOCATIONAL')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE academic_records MODIFY COLUMN educational_level ENUM('ELEMENTARY', 'HIGH SCHOOL', 'SENIOR HIGH SCHOOL', 'TERTIARY/COLLEGE', 'GRADUATE SCHOOL')");
    }
};
