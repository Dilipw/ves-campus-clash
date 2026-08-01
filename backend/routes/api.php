<?php

use App\Http\Controllers\Api\V1\GameController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\ParticipantController;
use App\Http\Controllers\Api\GameConfigController;



Route::prefix('v1')->group(function () {
    Route::get('/game/config', [GameConfigController::class, 'show']);
    Route::prefix('participants')->group(function () {

        Route::post('/register', [ParticipantController::class, 'register'])
            ->name('participants.register');
    });
    Route::prefix('game')->group(function () {
        Route::post('/start', [GameController::class, 'start'])
            ->name('games.start');

        Route::post('/progress', [GameController::class, 'progress'])
            ->name('games.progress');

        Route::post('/complete', [GameController::class, 'complete'])
            ->name('games.complete');

        Route::get('/result/{gameSessionUuid}', [GameController::class, 'result'])
            ->name('games.result');

        Route::get('/session/{gameSessionUuid}/status', [GameController::class, 'status'])
            ->name('games.status');
    });
});
