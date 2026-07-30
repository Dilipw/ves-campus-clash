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

    public function __construct(
        protected GameService $gameService
    ) {}

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

    /**
     * Lightweight status check used by the frontend route guard.
     * Intentionally returns only uuid + status — no score, no answers,
     * so it's safe to call before a session is completed.
     *
     * @param string $gameSessionUuid
     * @return JsonResponse
     */
    public function status(string $gameSessionUuid): JsonResponse
    {
        $session = $this->gameService->findByUuid($gameSessionUuid);

        return $this->successResponse([
            'uuid'            => $session->uuid,
            'status'          => $session->status_label,
            'current_level'   => $session->current_level,
            'matched_pairs'   => $session->matched_pairs,
            'moves'           => $session->moves,
            'remaining_time'  => $session->remaining_time,
            'score'           => $session->score,
        ], 'Game session status fetched successfully.');
    }
}
