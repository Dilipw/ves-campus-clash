<?php

namespace App\Http\Controllers\Api\V1;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Http\Requests\Api\V1\StartGameRequest;
use App\Http\Resources\Api\V1\GameSessionResource;

class GameController extends Controller
{
    use ApiResponse;

    /**
     * Constructor.
     */
    public function __construct(
        protected GameService $gameService
    ) {
    }

    /**
     * Start the game.
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
}