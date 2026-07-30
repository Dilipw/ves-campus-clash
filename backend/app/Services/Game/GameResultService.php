<?php

namespace App\Services\Game;

use App\Models\GameSession;
use App\Exceptions\BusinessException;
use App\Services\Game\Support\ResolvesGameSession;

class GameResultService
{
    use ResolvesGameSession;

    /**
     * Get completed game result.
     *
     * @param string $gameSessionUuid
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function get(string $gameSessionUuid): GameSession
    {
        $session = $this->findGameSession(
            $gameSessionUuid
        );

        if (! $session->isCompleted()) {

            throw new BusinessException(
                'Game is not completed yet.',
                422
            );

        }

        return $session->load([
            'participant',
            'storyCard',
        ]);
    }
}