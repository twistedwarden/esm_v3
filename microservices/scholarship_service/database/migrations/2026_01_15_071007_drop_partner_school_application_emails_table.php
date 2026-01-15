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
        Schema::dropIfExists('partner_school_application_emails');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('partner_school_application_emails', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id')->nullable();
            $table->string('sender_email');
            $table->string('sender_name');
            $table->string('school_name');
            $table->text('email_content');
            $table->enum('status', ['received', 'processed', 'account_created'])->default('received');
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();
        });
    }
};
