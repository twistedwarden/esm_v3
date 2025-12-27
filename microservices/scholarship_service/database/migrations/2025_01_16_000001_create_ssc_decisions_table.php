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
        Schema::create('ssc_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('scholarship_applications')->onDelete('cascade');
            $table->enum('decision', ['approved', 'rejected']);
            $table->decimal('approved_amount', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->bigInteger('decided_by')->nullable(); // user_id from auth service
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('application_id');
            $table->index('decision');
            $table->index('decided_by');
            $table->index('decided_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ssc_decisions');
    }
};

