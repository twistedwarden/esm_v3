<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('scholarship_applications');
        Schema::dropIfExists('scholarship_subcategories');
        Schema::dropIfExists('scholarship_categories');
        Schema::dropIfExists('schools');

        Schema::create('aid_disbursements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->string('application_number')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('method', 100);
            $table->string('provider_name');
            $table->string('reference_number');
            $table->string('receipt_path', 500);
            $table->text('notes')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamps();

            $table->index('application_id');
            $table->index('reference_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_disbursements');
    }
};

