<?php

namespace App\Services\Game\Support;

use App\Models\GameSession;
use App\Exceptions\BusinessException;

/**
 * Shared session lookup / state validation logic used by the
 * Start, Progress, Completion and Result services so it isn't
 * duplicated across each of them.
 */
trait ResolvesGameSession
{
    /**
     * Find game session by UUID.
     *
     * @param string $gameSessionUuid
     * @return GameSession
     *
     * @throws BusinessException
     */
    protected function findGameSession(string $gameSessionUuid): GameSession
    {
        $session = GameSession::query()
            ->with('participant')
            ->where('uuid', $gameSessionUuid)
            ->first();

        if (! $session) {
            throw new BusinessException(
                'Game session not found.',
                404
            );
        }

        return $session;
    }

    /**
     * Validate a session is eligible to be started.
     *
     * @param GameSession $session
     * @return void
     *
     * @throws BusinessException
     */
    protected function validateStartable(GameSession $session): void
    {
        if ($session->isCompleted()) {
            throw new BusinessException(
                'You have already completed this game.',
                409
            );
        }

        if ($session->isExpired()) {
            throw new BusinessException(
                'Your game session has expired.',
                410
            );
        }

        if ($session->isAbandoned()) {
            throw new BusinessException(
                'This game session is no longer available.',
                410
            );
        }

        if ($session->isPlaying()) {
            throw new BusinessException(
                'Game has already been started.',
                409
            );
        }
    }

    /**
     * Validate a session is currently active/playing.
     *
     * @param GameSession $session
     * @return void
     *
     * @throws BusinessException
     */
    protected function validateActive(GameSession $session): void
    {
        if ($session->isCompleted()) {
            throw new BusinessException(
                'This game has already been completed.',
                409
            );
        }

        if ($session->isExpired()) {
            throw new BusinessException(
                'Your game session has expired.',
                410
            );
        }

        if ($session->isAbandoned()) {
            throw new BusinessException(
                'This game session has been abandoned.',
                410
            );
        }

        if (! $session->isPlaying()) {
            throw new BusinessException(
                'Game has not been started yet.',
                409
            );
        }
    }
}