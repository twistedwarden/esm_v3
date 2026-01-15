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
        Schema::table('schools', function (Blueprint $table) {
            $table->enum('verification_status', ['not_applied', 'pending', 'verified', 'rejected'])->default('not_applied')->after('is_partner_school');
            $table->date('verification_date')->nullable()->after('verification_status');
            $table->date('verification_expiry_date')->nullable()->after('verification_date');
            $table->unsignedBigInteger('application_id')->nullable()->after('verification_expiry_date');
            
            $table->foreign('application_id')->references('id')->on('partner_school_applications')->onDelete('set null');
            $table->index('verification_status');
            $table->index('application_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->dropIndex(['verification_status']);
            $table->dropIndex(['application_id']);
            $table->dropColumn(['verification_status', 'verification_date', 'verification_expiry_date', 'application_id']);
        });
    }
};
