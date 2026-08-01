<?php

namespace App\Services\Game;

use Throwable;
use App\Models\GameLog;
use App\Models\GameSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\BusinessException;
use App\Services\Game\Support\ResolvesGameSession;
use App\Services\Game\Support\ValidatesGamePairs;

class GameProgressService
{
    use ResolvesGameSession, ValidatesGamePairs;

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
        DB::beginTransaction();

        try {

            $session = $this->findGameSession(
                $data['game_session_uuid']
            );

            $this->validateActive(
                $session
            );

            $data = $this->sanitizeProgressData(
                $session,
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Same server-authoritative timing as completion, so the progress
            | endpoint never shows a timer value that disagrees with what
            | complete() will ultimately persist.
            |--------------------------------------------------------------------------
            */
            [$timeTaken, $remainingTime] = $this->calculateServerTiming(
                $session
            );

            $levelledUp = $data['current_level'] > $session->current_level;

            $session = $this->updateProgress(
                $session,
                $data,
                $timeTaken,
                $remainingTime
            );

            if ($levelledUp) {
                $this->createLevelCompletedLog($session);
            }

            DB::commit();

            return $session->fresh();
        } catch (BusinessException $exception) {

            DB::rollBack();

            throw $exception;
        } catch (Throwable $exception) {

            DB::rollBack();

            Log::error('Unable to save game progress.', [
                'message' => $exception->getMessage(),
                'file'    => $exception->getFile(),
                'line'    => $exception->getLine(),
                'trace'   => $exception->getTraceAsString(),
            ]);

            throw new BusinessException(
                'Unable to save game progress.'
            );
        }
    }

    /**
     * Validate client-submitted gameplay data. Timing fields are no
     * longer accepted or validated here — see calculateServerTiming().
     *
     * matched_pairs is treated as a CUMULATIVE counter across the whole
     * session, same as before.
     *
     * @param GameSession $session
     * @param array $data
     * @return array
     *
     * @throws BusinessException
     */
    private function sanitizeProgressData(GameSession $session, array $data): array
    {
        $maxLevel = (int) config('game.levels.max_level');

        if ($data['current_level'] < $session->current_level) {
            throw new BusinessException('Invalid level progression.', 422);
        }

        if ($data['current_level'] > $session->current_level + 1) {
            throw new BusinessException('Cannot skip levels.', 422);
        }

        if ($data['current_level'] > $maxLevel) {
            throw new BusinessException('Invalid level.', 422);
        }

        if ($data['matched_pairs'] < $session->matched_pairs) {
            throw new BusinessException('Matched pairs cannot decrease.', 422);
        }

        $maxPairsForLevel = $this->cumulativePairsCapForLevel(
            $data['current_level']
        );

        if ($data['matched_pairs'] > $maxPairsForLevel) {
            throw new BusinessException('Matched pairs exceed the level limit.', 422);
        }

        if ($data['moves'] < $session->moves) {
            throw new BusinessException('Moves cannot decrease.', 422);
        }

        // Score and timing are never accepted from the client.
        unset($data['score'], $data['time_taken'], $data['remaining_time']);

        return $data;
    }

    /**
     * Derive authoritative time_taken / remaining_time from started_at
     * vs. the current server clock. Duplicated intentionally from
     * GameCompletionService — if you'd rather share it, pull both into
     * a small trait (e.g. CalculatesGameTiming) used by both services.
     *
     * @param GameSession $session
     * @return array{0: int, 1: int} [$timeTaken, $remainingTime]
     */
    private function calculateServerTiming(GameSession $session): array
    {
        $totalBudget = (int) collect(config('game.levels'))->sum('duration');

        $elapsedSeconds = $session->started_at
            ? $session->started_at->diffInSeconds(now())
            : $totalBudget;

        $timeTaken = max(0, min($elapsedSeconds, $totalBudget));

        $remainingTime = max(0, $totalBudget - $timeTaken);

        return [$timeTaken, $remainingTime];
    }

    /**
     * Update game session progress with server-calculated timing.
     *
     * @param GameSession $session
     * @param array $data
     * @param int $timeTaken
     * @param int $remainingTime
     * @return GameSession
     */
    private function updateProgress(
        GameSession $session,
        array $data,
        int $timeTaken,
        int $remainingTime
    ): GameSession {

        $session->update([

            'current_level' => $data['current_level'],

            'moves' => $data['moves'],

            'matched_pairs' => $data['matched_pairs'],

            'remaining_time' => $remainingTime,

            'time_taken' => $timeTaken,

        ]);

        return $session->fresh();
    }

    /**
     * Create a game log entry for a completed level.
     *
     * @param GameSession $session
     * @return void
     */
    private function createLevelCompletedLog(GameSession $session): void
    {
        GameLog::create([

            'game_session_id' => $session->id,

            'level' => $session->current_level,

            'event_type' => GameLog::EVENT_LEVEL_COMPLETED,

            'score' => $session->score,

            'moves' => $session->moves,

            'matched_pairs' => $session->matched_pairs,

            'remaining_time' => $session->remaining_time,

            'description' => "Level {$session->current_level} reached.",

            'logged_at' => now(),

        ]);
    }
}