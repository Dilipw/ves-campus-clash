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
        Schema::create('participants', function (Blueprint $table) {
            $table->id();

            $table->uuid('uuid')->unique()->comment('Public unique identifier');

            $table->string('full_name', 150);

            $table->string('profile_photo')->nullable()->comment('Participant profile photo');

            $table->string('instagram_handle', 100);

            $table->string('institute', 150);

            $table->string('course', 100);

            $table->string('academic_year', 30);

            $table->boolean('follow_confirmed')
                ->default(false)
                ->comment('0 = No, 1 = Yes');

            $table->string('registration_source', 50)
                ->nullable()
                ->comment('QR, Direct, Campaign etc.');

            $table->timestamp('registered_at')
                ->useCurrent();

            $table->timestamps();

            $table->softDeletes();

            $table->index('instagram_handle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
