<?php

use Throwable;
use Illuminate\Http\Request;
use App\Exceptions\BusinessException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->render(function (
            BusinessException $exception,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->getStatus());
        });

        $exceptions->render(function (
            Throwable $exception,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            report($exception);

            return response()->json([
                'success' => false,
                'message' => config('app.debug')
                    ? $exception->getMessage()
                    : 'Internal Server Error.',
            ], 500);
        });

    })
    ->create();