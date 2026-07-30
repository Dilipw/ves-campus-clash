<?php

namespace App\Services\Game;

use App\Models\GameSession;
use App\Exceptions\BusinessException;
use App\Services\Game\Support\ResolvesGameSession;

class GameResultService
{
    use ResolvesGameSession;

    /**
     * Fetch the result/current state of a game session by UUID.
     * Used by the frontend to recover gracefully after a page
     * refresh, rather than relying on local/session storage.
     *
     * @param string $gameSessionUuid
     * @return GameSession
     *
     * @throws BusinessException
     */
    public function get(string $gameSessionUuid): GameSession
    {
        return $this->findGameSession($gameSessionUuid);
    }
}