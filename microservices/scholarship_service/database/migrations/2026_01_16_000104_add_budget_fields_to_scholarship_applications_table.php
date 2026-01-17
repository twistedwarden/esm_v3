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
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->foreignId('budget_id')->nullable()->after('school_id')->constrained('partner_school_budgets')->onDelete('set null');
            $table->enum('processed_by', ['foundation', 'partner_school'])->default('foundation')->after('status');
            $table->timestamp('fund_reserved_at')->nullable()->after('processed_by');
            $table->timestamp('fund_disbursed_at')->nullable()->after('fund_reserved_at');
            $table->foreignId('disbursement_id')->nullable()->after('fund_disbursed_at')->constrained('fund_disbursements')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->dropForeign(['budget_id']);
            $table->dropForeign(['disbursement_id']);
            $table->dropColumn([
                'budget_id',
                'processed_by',
                'fund_reserved_at',
                'fund_disbursed_at',
                'disbursement_id'
            ]);
        });
    }
};
