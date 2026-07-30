<?php

use App\Http\Controllers\Api\V1\GameController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\ParticipantController;

Route::prefix('v1')->group(function () {

    Route::prefix('participants')->group(function () {

        Route::post('/register', [ParticipantController::class, 'register']);
    });
    Route::prefix('game')->group(function () {
        Route::post('/start', [GameController::class, 'start']);
    });
});
