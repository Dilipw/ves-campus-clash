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
        Schema::create('game_sessions', function (Blueprint $table) {

            $table->id();

            $table->uuid('uuid')
                ->unique()
                ->comment('Public unique identifier');

            $table->foreignId('participant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('game_name',100)
                ->default('Memory Match Challenge');

            $table->tinyInteger('current_level')
                ->default(1)
                ->comment('Current game level');

            $table->tinyInteger('status')
                ->default(1)
                ->comment('1=Started,2=Level1 Completed,3=Level2 Completed,4=Completed,5=Expired,6=Abandoned');

            $table->unsignedInteger('score')
                ->default(0);

            $table->unsignedSmallInteger('moves')
                ->default(0);

            $table->unsignedSmallInteger('matched_pairs')
                ->default(0);

            $table->unsignedSmallInteger('remaining_time')
                ->default(0)
                ->comment('Remaining seconds');

            $table->unsignedSmallInteger('time_taken')
                ->default(0)
                ->comment('Total seconds played');

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamp('expires_at')
                ->nullable();

            $table->string('device_type',30)
                ->nullable();

            $table->string('browser',80)
                ->nullable();

            $table->string('operating_system',80)
                ->nullable();

            $table->ipAddress('ip_address')
                ->nullable();

            $table->timestamps();

            $table->softDeletes();

            $table->index('participant_id');
            $table->index('status');
            $table->index('score');
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};