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
use App\Services\Game\Support\CalculatesGameTiming;

class GameProgressService
{
    use ResolvesGameSession, ValidatesGamePairs, CalculatesGameTiming;

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
            | Same server-authoritative timing as GameCompletionService, via the
            | shared CalculatesGameTiming trait, so a progress snapshot mid-game
            | and the eventual completion record can never disagree.
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

            /*
            |--------------------------------------------------------------------------
            | Only write a GameLog row for a significant event (level completed).
            | Plain progress ticks (a move, a tick of the clock) still persist to
            | the game_sessions row above, but no longer spam the game_logs table.
            |--------------------------------------------------------------------------
            */

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
     * Validate and clamp client-submitted gameplay data against the
     * session's current server-side state. time_taken / remaining_time
     * are not accepted from the client — see calculateServerTiming().
     *
     * matched_pairs is treated as a CUMULATIVE counter across the whole
     * session (it never resets between levels — a player on level 2
     * who has matched 3 pairs so far this level should be reporting
     * 8 + 3 = 11, not 3).
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
     * This is one of the whitelisted "significant" events.
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