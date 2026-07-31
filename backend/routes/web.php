<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ImageController;

Route::get('/media/{path}', [ImageController::class, 'show'])
    ->where('path', '.*')
    ->name('media.show');

Route::get('/', function () {
    return view('welcome');
});
