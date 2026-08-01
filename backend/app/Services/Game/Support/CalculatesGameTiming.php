<?php

namespace App\Services\Game\Support;

use App\Models\GameSession;

/**
 * Server-authoritative game timing.
 *
 * time_taken / remaining_time are NEVER accepted from the client. Both
 * are derived here from the session's started_at timestamp vs. the
 * current server clock, and from the total time budget configured in
 * config('game.levels.duration_by_level'). This is the single source
 * of truth for timing across GameProgressService and
 * GameCompletionService — both use this trait so they can never
 * disagree about how time is measured.
 */
trait CalculatesGameTiming
{
    /**
     * Derive authoritative [time_taken, remaining_time] from
     * started_at and the current server clock.
     *
     * @param GameSession $session
     * @return array{0: int, 1: int} [$timeTaken, $remainingTime]
     */
    protected function calculateServerTiming(GameSession $session): array
    {
        $totalBudget = $this->totalGameDurationSeconds();

        // Defensive fallback: if started_at is somehow missing, treat the
        // whole budget as elapsed rather than dividing by/against null.
        $elapsedSeconds = $session->started_at
            ? $session->started_at->diffInSeconds(now())
            : $totalBudget;

        // Clamp: elapsed can't exceed the total budget (covers a
        // completion/progress request arriving late, e.g. after a
        // network retry) and can't be negative.
        $timeTaken = max(0, min($elapsedSeconds, $totalBudget));

        $remainingTime = max(0, $totalBudget - $timeTaken);

        return [$timeTaken, $remainingTime];
    }

    /**
     * Total configured game duration across all levels, in seconds.
     * Sourced from config('game.levels.duration_by_level') — the same
     * per-level durations the frontend fetches via GET /game/config,
     * so client and server always agree on the total budget.
     *
     * @return int
     */
    protected function totalGameDurationSeconds(): int
    {
        return (int) array_sum(
            config('game.levels.duration_by_level', [])
        );
    }
}