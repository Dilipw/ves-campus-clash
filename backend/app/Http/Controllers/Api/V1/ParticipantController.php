<?php

namespace App\Http\Controllers\Api\V1;

use Throwable;
use App\Traits\ApiResponse;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\Api\V1\ParticipantResource;
use App\Http\Requests\Api\V1\RegisterParticipantRequest;

class ParticipantController extends Controller
{
    use ApiResponse;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected ParticipantService $participantService
    ) {
    }

    /**
     * Register a new participant.
     *
     * @param RegisterParticipantRequest $request
     * @return JsonResponse
     */
    public function register(RegisterParticipantRequest $request): JsonResponse
    {
        try {

            $participant = $this->participantService->register(
                $request->validated()
            );

            $participant->load('latestGameSession');

            return $this->successResponse(
                new ParticipantResource($participant),
                'Participant registered successfully.',
                201
            );

        } catch (BusinessException $exception) {

            return $this->errorResponse(
                $exception->getMessage(),
                422
            );

        } catch (Throwable $exception) {

            report($exception);

            return $this->serverErrorResponse(
                'Something went wrong. Please try again later.'
            );
        }
    }
}