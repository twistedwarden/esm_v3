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
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('budget_enabled')->default(false)->after('is_active');
            $table->foreignId('current_budget_id')->nullable()->after('budget_enabled')->constrained('partner_school_budgets')->onDelete('set null');
            $table->decimal('total_allocated_lifetime', 15, 2)->default(0)->after('current_budget_id');
            $table->decimal('total_disbursed_lifetime', 15, 2)->default(0)->after('total_allocated_lifetime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign(['current_budget_id']);
            $table->dropColumn([
                'budget_enabled',
                'current_budget_id',
                'total_allocated_lifetime',
                'total_disbursed_lifetime'
            ]);
        });
    }
};
