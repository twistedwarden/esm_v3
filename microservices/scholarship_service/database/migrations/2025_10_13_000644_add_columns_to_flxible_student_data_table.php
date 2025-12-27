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
        Schema::table('flexible_student_data', function (Blueprint $table) {
            $table->unsignedBigInteger('school_id')->after('id');
            $table->string('student_id_number', 50)->after('school_id');
            $table->string('first_name', 100)->after('student_id_number');
            $table->string('last_name', 100)->after('first_name');
            $table->json('data')->nullable()->after('last_name');
            $table->json('headers')->nullable()->after('data');
            $table->string('uploaded_by')->after('headers');
            $table->timestamp('uploaded_at')->nullable()->after('uploaded_by');
            
            // Add foreign key constraint
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            
            // Add index for better performance
            $table->index('school_id');
            $table->index('student_id_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flexible_student_data', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropIndex(['school_id']);
            $table->dropIndex(['student_id_number']);
            $table->dropColumn([
                'school_id',
                'student_id_number',
                'first_name',
                'last_name',
                'data',
                'headers',
                'uploaded_by',
                'uploaded_at'
            ]);
        });
    }
};
