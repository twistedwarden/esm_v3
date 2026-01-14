<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id')->index();
            $table->string('application_number', 50)->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->string('transaction_reference', 100)->unique()->comment('Unique transaction ID from payment provider');
            $table->enum('payment_provider', ['gcash', 'maya', 'paymongo', 'bpi', 'bdo', 'unionbank', 'landbank', 'manual'])->comment('Payment gateway or bank used');
            $table->enum('payment_method', ['digital_wallet', 'bank_transfer', 'over_the_counter', 'online_banking', 'manual'])->comment('Method of payment');
            $table->decimal('transaction_amount', 15, 2);
            $table->enum('transaction_status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])->default('pending')->index();
            $table->string('payment_link_url', 500)->nullable()->comment('URL to payment gateway checkout page');
            $table->string('provider_transaction_id', 100)->nullable()->comment('Transaction ID from payment provider');
            $table->string('provider_reference_number', 100)->nullable()->comment('Reference number from payment provider');
            $table->timestamp('initiated_at')->nullable()->comment('When payment was initiated');
            $table->timestamp('completed_at')->nullable()->comment('When payment was completed');
            $table->timestamp('expires_at')->nullable()->comment('Payment link expiration time');
            $table->json('provider_response')->nullable()->comment('Full response from payment provider');
            $table->text('failure_reason')->nullable()->comment('Reason if transaction failed');
            $table->unsignedBigInteger('initiated_by_user_id')->nullable()->comment('User who initiated the payment');
            $table->string('initiated_by_name')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['transaction_status', 'created_at']);
            $table->index(['payment_provider', 'transaction_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
