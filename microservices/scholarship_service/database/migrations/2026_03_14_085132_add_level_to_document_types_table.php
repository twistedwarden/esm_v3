<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('document_types', 'level')) {
            Schema::table('document_types', function (Blueprint $table) {
                // 'college' = college only, 'senior_high' = SHS only, 'vocational' = vocational/tech-voc only, 'both' = applies to all
                $table->enum('level', ['college', 'senior_high', 'vocational', 'both'])->default('both')->after('is_active');
            });
        }
    }

    public function down(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
