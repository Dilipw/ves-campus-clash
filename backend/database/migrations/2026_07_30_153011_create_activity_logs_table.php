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
        Schema::create('activity_logs', function (Blueprint $table) {

            $table->id();

            $table->foreignId('participant_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->tinyInteger('activity_type')
                ->comment('1=Landing,2=Follow Confirmed,3=Registration,4=Game Started,5=Game Completed,6=Story Viewed,7=Story Downloaded');

            $table->string('title', 100);

            $table->text('description')
                ->nullable();

            $table->ipAddress('ip_address')
                ->nullable();

            $table->string('device_type', 30)
                ->nullable();

            $table->string('browser', 80)
                ->nullable();

            $table->string('operating_system', 80)
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->timestamp('logged_at')
                ->useCurrent();

            $table->timestamps();

            $table->index('participant_id');
            $table->index('activity_type');
            $table->index('logged_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
