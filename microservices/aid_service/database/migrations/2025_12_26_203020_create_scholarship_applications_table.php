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
        Schema::create('scholarship_applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_number')->unique();
            $table->foreignId('student_id');
            $table->foreignId('school_id');
            $table->foreignId('category_id')->nullable();
            $table->foreignId('subcategory_id')->nullable();
            $table->enum('status', ['submitted', 'under_review', 'approved', 'pending_disbursement', 'grants_processing', 'grants_disbursed', 'payment_failed', 'disbursed', 'received', 'rejected'])->default('submitted');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->decimal('approved_amount', 10, 2)->nullable();
            $table->string('payment_method')->nullable();
            $table->string('provider_name')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_of_transfer_path')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->json('digital_wallets')->nullable();
            $table->string('wallet_account_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scholarship_applications');
    }
};
