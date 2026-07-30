<?php

namespace App\Http\Controllers\Api\V1;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Http\Requests\Api\V1\StartGameRequest;
use App\Http\Requests\Api\V1\CompleteGameRequest;
use App\Http\Requests\Api\V1\UpdateGameProgressRequest;
use App\Http\Resources\Api\V1\GameResultResource;
use App\Http\Resources\Api\V1\GameSessionResource;

class GameController extends Controller
{
    use ApiResponse;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected GameService $gameService
    ) {
    }

    /**
     * Start a new game session.
     *
     * @param StartGameRequest $request
     * @return JsonResponse
     */
    public function start(StartGameRequest $request): JsonResponse
    {
        $session = $this->gameService->start(
            $request->validated()
        );

        return $this->successResponse(
            new GameSessionResource($session),
            'Game started successfully.'
        );
    }

    /**
     * Save game progress.
     *
     * @param UpdateGameProgressRequest $request
     * @return JsonResponse
     */
    public function progress(
        UpdateGameProgressRequest $request
    ): JsonResponse {

        $session = $this->gameService->saveProgress(
            $request->validated()
        );

        return $this->successResponse(
            new GameSessionResource($session),
            'Game progress saved successfully.'
        );
    }

    /**
     * Complete the game.
     *
     * @param CompleteGameRequest $request
     * @return JsonResponse
     */
    public function complete(
        CompleteGameRequest $request
    ): JsonResponse {

        $session = $this->gameService->complete(
            $request->validated()
        );

        return $this->successResponse(
            new GameResultResource($session),
            'Game completed successfully.'
        );
    }

    /**
     * Get game result.
     *
     * @param string $gameSessionUuid
     * @return JsonResponse
     */
    public function result(
        string $gameSessionUuid
    ): JsonResponse {

        $session = $this->gameService->result(
            $gameSessionUuid
        );

        return $this->successResponse(
            new GameResultResource($session),
            'Game result fetched successfully.'
        );
    }
}