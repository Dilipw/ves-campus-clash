<?php

namespace App\Http\Controllers\Api\V1;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\ParticipantService;
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
     */
    public function register(RegisterParticipantRequest $request): JsonResponse
    {
        $participant = $this->participantService->register(
            $request->validated()
        );

        $participant->load('latestGameSession');

        return $this->successResponse(
            new ParticipantResource($participant),
            'Participant registered successfully.',
            201
        );
    }
}