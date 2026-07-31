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
    use ResolvesGameSession,ValidatesGamePairs;

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

            /*
            |--------------------------------------------------------------------------
            | Never trust client-submitted progress blindly. Reject anything that
            | is not a plausible continuation of the session's current state.
            |--------------------------------------------------------------------------
            */

            $data = $this->sanitizeProgressData(
                $session,
                $data
            );

            $levelledUp = $data['current_level'] > $session->current_level;

            $session = $this->updateProgress(
                $session,
                $data
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
     * Validate and clamp client-submitted progress data against the
     * session's current server-side state. Throws when the payload
     * describes an impossible transition (e.g. going backwards,
     * skipping levels, or exceeding configured bounds).
     *
     * IMPORTANT: matched_pairs is treated as a CUMULATIVE counter across
     * the whole session (it never resets between levels — a player on
     * level 2 who has matched 3 pairs so far this level should be
     * reporting 8 + 3 = 11, not 3). This is the only design that lets
     * a single monotonic-never-decreases field coexist with a per-level
     * pair limit across a multi-level game, since each level can have
     * a different pair count.
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

        if ($data['remaining_time'] > $session->remaining_time) {
            throw new BusinessException('Remaining time cannot increase.', 422);
        }

        if ($data['remaining_time'] < 0) {
            throw new BusinessException('Remaining time cannot be negative.', 422);
        }

        if ($data['time_taken'] < $session->time_taken) {
            throw new BusinessException('Time taken cannot decrease.', 422);
        }

        // Score is never accepted from the client during progress updates;
        // it is only ever computed server-side, at completion.
        unset($data['score']);

        return $data;
    }


    /**
     * Update game session progress.
     *
     * @param GameSession $session
     * @param array $data
     * @return GameSession
     */
    private function updateProgress(GameSession $session, array $data): GameSession
    {
        $session->update([

            'current_level' => $data['current_level'],

            'moves' => $data['moves'],

            'matched_pairs' => $data['matched_pairs'],

            'remaining_time' => $data['remaining_time'],

            'time_taken' => $data['time_taken'],

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
