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
        Schema::table('partner_school_budgets', function (Blueprint $table) {
            $table->unsignedBigInteger('source_budget_id')
                ->nullable()
                ->after('id')
                ->comment('Links to budget_allocations table - tracks which main budget this allocation comes from');

            $table->foreign('source_budget_id')
                ->references('id')
                ->on('budget_allocations')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partner_school_budgets', function (Blueprint $table) {
            $table->dropForeign(['source_budget_id']);
            $table->dropColumn('source_budget_id');
        });
    }
};
