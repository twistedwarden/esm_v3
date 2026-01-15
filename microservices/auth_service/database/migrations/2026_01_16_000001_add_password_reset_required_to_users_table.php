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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('password_reset_required')->default(false)->after('password');
            $table->string('password_reset_token')->nullable()->after('password_reset_required');
            $table->timestamp('password_reset_expires_at')->nullable()->after('password_reset_token');
            
            $table->index('password_reset_token');
            $table->index('password_reset_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['password_reset_token']);
            $table->dropIndex(['password_reset_required']);
            $table->dropColumn(['password_reset_required', 'password_reset_token', 'password_reset_expires_at']);
        });
    }
};
