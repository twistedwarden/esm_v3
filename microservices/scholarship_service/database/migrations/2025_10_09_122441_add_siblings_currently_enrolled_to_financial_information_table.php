<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('financial_information', function (Blueprint $table) {
            $table->integer('siblings_currently_enrolled')->default(0)->after('number_of_siblings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_information', function (Blueprint $table) {
            $table->dropColumn('siblings_currently_enrolled');
        });
    }
};
