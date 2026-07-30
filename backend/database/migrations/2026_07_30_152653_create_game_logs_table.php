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
        Schema::create('game_logs', function (Blueprint $table) {

            $table->id();

            $table->foreignId('game_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->tinyInteger('event_type')
                ->comment('1=Game Started,2=Level Completed,3=Power Up,4=Game Completed,5=Session Expired,6=Abandoned');

            $table->tinyInteger('level')
                ->default(1);

            $table->unsignedInteger('score')
                ->default(0);

            $table->unsignedSmallInteger('moves')
                ->default(0);

            $table->unsignedSmallInteger('matched_pairs')
                ->default(0);

            $table->unsignedSmallInteger('remaining_time')
                ->default(0);

            $table->text('description')
                ->nullable();

            $table->json('metadata')
                ->nullable()
                ->comment('Additional event information');

            $table->timestamp('logged_at')
                ->useCurrent();

            $table->timestamps();

            $table->index('game_session_id');
            $table->index('event_type');
            $table->index('level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_logs');
    }
};