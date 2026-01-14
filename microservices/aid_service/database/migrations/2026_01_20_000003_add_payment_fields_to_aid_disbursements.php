<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            // Add payment transaction reference (only if doesn't exist)
            if (!Schema::hasColumn('aid_disbursements', 'payment_transaction_id')) {
                $table->unsignedBigInteger('payment_transaction_id')->nullable()->after('application_id')->comment('Reference to payment_transactions table');
            }
            
            // Add payment-related columns (only if doesn't exist)
            if (!Schema::hasColumn('aid_disbursements', 'payment_provider')) {
                $table->enum('payment_provider', ['gcash', 'maya', 'paymongo', 'bpi', 'bdo', 'unionbank', 'landbank', 'manual'])->nullable()->after('provider_name')->comment('Payment gateway or bank used');
            }
            
            if (!Schema::hasColumn('aid_disbursements', 'provider_transaction_id')) {
                $table->string('provider_transaction_id', 100)->nullable()->after('payment_provider')->comment('Transaction ID from payment provider');
            }
            
            if (!Schema::hasColumn('aid_disbursements', 'disbursement_status')) {
                $table->enum('disbursement_status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending')->after('reference_number');
            }
            
            // Add aliases for backward compatibility (keep old column names, add new ones)
            if (!Schema::hasColumn('aid_disbursements', 'disbursement_method')) {
                $table->string('disbursement_method', 100)->nullable()->after('method')->comment('Method of disbursement');
            }
            
            if (!Schema::hasColumn('aid_disbursements', 'payment_provider_name')) {
                $table->string('payment_provider_name')->nullable()->after('provider_name')->comment('Payment provider name');
            }
            
            if (!Schema::hasColumn('aid_disbursements', 'disbursement_reference_number')) {
                $table->string('disbursement_reference_number')->nullable()->after('reference_number')->comment('Disbursement reference number');
            }
        });
        
        // Add indexes separately to avoid conflicts
        Schema::table('aid_disbursements', function (Blueprint $table) {
            if (!$this->indexExists('aid_disbursements', 'payment_transaction_id')) {
                $table->index('payment_transaction_id');
            }
            if (!$this->indexExists('aid_disbursements', 'disbursement_status')) {
                $table->index('disbursement_status');
            }
        });
    }
    
    private function indexExists($table, $column)
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        $indexes = $connection->select("SHOW INDEX FROM `{$table}` WHERE Column_name = '{$column}'");
        return count($indexes) > 0;
    }

    public function down(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            $columns = [
                'payment_transaction_id',
                'payment_provider',
                'provider_transaction_id',
                'disbursement_status',
                'disbursement_method',
                'payment_provider_name',
                'disbursement_reference_number'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('aid_disbursements', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
