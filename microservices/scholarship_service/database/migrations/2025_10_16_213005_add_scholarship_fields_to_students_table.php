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
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'scholarship_status')) {
                $table->string('scholarship_status')->nullable()->after('preferred_mobile_number');
            }
            if (!Schema::hasColumn('students', 'current_scholarship_id')) {
                $table->unsignedBigInteger('current_scholarship_id')->nullable()->after('scholarship_status');
            }
            if (!Schema::hasColumn('students', 'approved_amount')) {
                $table->decimal('approved_amount', 10, 2)->nullable()->after('current_scholarship_id');
            }
            if (!Schema::hasColumn('students', 'scholarship_start_date')) {
                $table->date('scholarship_start_date')->nullable()->after('approved_amount');
            }
        });

        // Add foreign key constraint separately to avoid duplicate key error
        if (!Schema::hasColumn('students', 'current_scholarship_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreign('current_scholarship_id')->references('id')->on('scholarship_applications')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['current_scholarship_id']);
            $table->dropColumn([
                'scholarship_status',
                'current_scholarship_id',
                'approved_amount',
                'scholarship_start_date'
            ]);
        });
    }
};
