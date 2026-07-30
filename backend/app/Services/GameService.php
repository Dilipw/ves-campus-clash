<?php

namespace App\Services;

use App\Models\GameSession;
use App\Exceptions\BusinessException;
use App\Services\Game\GameStartService;
use App\Services\Game\GameResultService;
use App\Services\Game\GameProgressService;
use App\Services\Game\GameCompletionService;

/**
 * Thin facade over the split game services (GameStartService,
 * GameProgressService, GameCompletionService, GameResultService).
 *
 * Kept so existing controllers that inject GameService and call
 * start()/saveProgress()/complete() don't need to change. New code
 * (or the controller once refactored) can also inject the specific
 * service it needs directly.
 */
class GameService
{
    public function __construct(
        protected GameStartService $startService,
        protected GameProgressService $progressService,
        protected GameCompletionService $completionService,
        protected GameResultService $resultService,
    ) {}

    /**
     * Start participant game.
     *
     * @param array $data
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function start(array $data): GameSession
    {
        return $this->startService->start($data);
    }

    /**
     * Save game progress.
     *
     * @param array $data
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function saveProgress(array $data): GameSession
    {
        return $this->progressService->saveProgress($data);
    }

    /**
     * Complete game session.
     *
     * @param array $data
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function complete(array $data): GameSession
    {
        return $this->completionService->complete($data);
    }

    /**
     * Get game result / current state by session UUID.
     *
     * @param string $gameSessionUuid
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function result(string $gameSessionUuid): GameSession
    {
        return $this->resultService->get($gameSessionUuid);
    }
    public function findByUuid(string $uuid): GameSession
    {
        return GameSession::where('uuid', $uuid)
            ->firstOrFail();
    }
}
