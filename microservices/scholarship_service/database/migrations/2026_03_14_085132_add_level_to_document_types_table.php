<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            // 'college' = college only, 'senior_high' = SHS only, 'both' = applies to both
            $table->enum('level', ['college', 'senior_high', 'both'])->default('both')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
