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
        Schema::table('aid_disbursements', function (Blueprint $table) {
            // Add account number field for storing wallet/bank account number
            if (!Schema::hasColumn('aid_disbursements', 'account_number')) {
                // Check if provider_transaction_id exists, otherwise place after reference_number
                if (Schema::hasColumn('aid_disbursements', 'provider_transaction_id')) {
                    $table->string('account_number', 100)->nullable()->after('provider_transaction_id')->comment('Wallet or bank account number used for disbursement');
                } elseif (Schema::hasColumn('aid_disbursements', 'reference_number')) {
                    $table->string('account_number', 100)->nullable()->after('reference_number')->comment('Wallet or bank account number used for disbursement');
                } else {
                    $table->string('account_number', 100)->nullable()->comment('Wallet or bank account number used for disbursement');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            if (Schema::hasColumn('aid_disbursements', 'account_number')) {
                $table->dropColumn('account_number');
            }
        });
    }
};
