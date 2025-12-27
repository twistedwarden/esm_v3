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
        Schema::create('partner_school_representatives', function (Blueprint $table) {
            $table->id();
            $table->string('citizen_id')->unique()->comment('Citizen ID from auth service');
            $table->unsignedBigInteger('school_id')->comment('School they represent');
            $table->boolean('is_active')->default(true);
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            // Foreign key
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            
            // Indexes
            $table->index('citizen_id');
            $table->index('school_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_school_representatives');
    }
};

