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
        Schema::create('story_cards', function (Blueprint $table) {

            $table->id();

            $table->foreignId('participant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('game_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->tinyInteger('status')
                ->default(1)
                ->comment('1=Generated,2=Downloaded,3=Shared');

            $table->unsignedInteger('download_count')
                ->default(0);

            $table->unsignedInteger('share_count')
                ->default(0);

            $table->timestamp('generated_at')
                ->useCurrent();

            $table->timestamp('downloaded_at')
                ->nullable();

            $table->timestamp('shared_at')
                ->nullable();

            $table->timestamps();

            $table->softDeletes();

            $table->index('participant_id');
            $table->index('game_session_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('story_cards');
    }
};