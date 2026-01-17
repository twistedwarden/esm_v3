<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        for ($i = 1; $i <= 13; $i++) {
            Schema::dropIfExists('school_' . $i . '_student_data');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No operation as we cannot easily recreate the dropped tables with data
    }
};
