<?php

use Illuminate\Http\Request;
use App\Exceptions\BusinessException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
         $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Handle Validation Exceptions (must come before the generic
        // Throwable catch-all, otherwise every validation failure
        // gets reported as a 500 instead of a 422).
        $exceptions->render(function (
            ValidationException $exception,
            Request $request
        ) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'errors'  => $exception->errors(),
            ], 422);
        });

        // Handle Business Exceptions
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

        // Handle All Other Exceptions
        $exceptions->render(function (
            \Throwable $exception,
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