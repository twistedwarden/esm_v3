<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            $table->unsignedBigInteger('disbursed_by_user_id')->nullable()->after('notes');
            $table->string('disbursed_by_name')->nullable()->after('disbursed_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('aid_disbursements', function (Blueprint $table) {
            $table->dropColumn(['disbursed_by_user_id', 'disbursed_by_name']);
        });
    }
};

