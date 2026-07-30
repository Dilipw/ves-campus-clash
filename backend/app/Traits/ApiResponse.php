<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Success Response.
     *
     * @param mixed $data
     * @param string $message
     * @param int $status
     * @return JsonResponse
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success.',
        int $status = 200
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => $message,

            'data' => $data,

        ], $status);

    }

    /**
     * Error Response.
     *
     * @param string $message
     * @param int $status
     * @param mixed|null $errors
     * @return JsonResponse
     */
    protected function errorResponse(
        string $message = 'Something went wrong.',
        int $status = 400,
        mixed $errors = null
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

            'errors' => $errors,

        ], $status);

    }

    /**
     * Validation Error Response.
     *
     * @param mixed $errors
     * @param string $message
     * @return JsonResponse
     */
    protected function validationErrorResponse(
        mixed $errors,
        string $message = 'Validation failed.'
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

            'errors' => $errors,

        ], 422);

    }

    /**
     * Not Found Response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function notFoundResponse(
        string $message = 'Resource not found.'
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

        ], 404);

    }

    /**
     * Unauthorized Response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function unauthorizedResponse(
        string $message = 'Unauthorized.'
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

        ], 401);

    }

    /**
     * Forbidden Response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function forbiddenResponse(
        string $message = 'Forbidden.'
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

        ], 403);

    }

    /**
     * Server Error Response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function serverErrorResponse(
        string $message = 'Internal server error.'
    ): JsonResponse {

        return response()->json([

            'success' => false,

            'message' => $message,

        ], 500);

    }
}