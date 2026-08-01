<?php

namespace App\Services\Game;

use Throwable;
use App\Models\GameLog;
use App\Models\GameSession;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\BusinessException;
use App\Services\ActivityLogService;
use App\Services\Game\Support\ResolvesGameSession;
use App\Services\Game\Support\ValidatesGamePairs;

class GameCompletionService
{
    use ResolvesGameSession, ValidatesGamePairs;

    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

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
        DB::beginTransaction();

        try {

            $session = $this->findGameSession(
                $data['game_session_uuid']
            );

            $this->validateActive(
                $session
            );

            $data = $this->sanitizeCompletionData(
                $session,
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Server is the single source of truth for timing. We no longer trust
            | time_taken / remaining_time sent by the client — we derive both from
            | started_at vs. the current server clock. This is immune to client
            | clock drift, tab-throttling, or a tampered payload.
            |--------------------------------------------------------------------------
            */
            [$timeTaken, $remainingTime] = $this->calculateServerTiming(
                $session
            );

            $finalScore = $this->calculateFinalScore(
                matchedPairs: $data['matched_pairs'],
                moves: $data['moves'],
                remainingTime: $remainingTime
            );

            $session = $this->completeSession(
                $session,
                $data,
                $finalScore,
                $timeTaken,
                $remainingTime
            );

            $this->createGameCompleteLog(
                $session
            );

            $this->createGameCompletedActivityLog(
                $session
            );

            DB::commit();

            return $session->fresh();
        } catch (BusinessException $exception) {

            DB::rollBack();

            throw $exception;
        } catch (Throwable $exception) {

            DB::rollBack();

            Log::error('Unable to complete game.', [
                'message' => $exception->getMessage(),
                'file'    => $exception->getFile(),
                'line'    => $exception->getLine(),
                'trace'   => $exception->getTraceAsString(),
            ]);

            throw new BusinessException(
                'Unable to complete the game.'
            );
        }
    }

    /**
     * Validate completion data against the session's current server
     * state. Timing fields (time_taken / remaining_time) are no longer
     * validated here because they are no longer accepted from the
     * client at all — see calculateServerTiming().
     *
     * @param GameSession $session
     * @param array $data
     * @return array
     *
     * @throws BusinessException
     */
    private function sanitizeCompletionData(GameSession $session, array $data): array
    {
        if ($data['matched_pairs'] < $session->matched_pairs) {
            throw new BusinessException('Matched pairs cannot decrease.', 422);
        }

        $maxPairsForLevel = $this->cumulativePairsCapForLevel(
            $data['current_level']
        );

        if ($data['matched_pairs'] > $maxPairsForLevel) {
            throw new BusinessException(
                'Matched pairs exceed the level limit.',
                422
            );
        }

        if ($data['moves'] < $session->moves) {
            throw new BusinessException('Moves cannot decrease.', 422);
        }

        if ($data['current_level'] < $session->current_level) {
            throw new BusinessException('Invalid level progression.', 422);
        }

        // Score, time_taken, and remaining_time are never trusted from the
        // client. Score is computed below; timing is server-derived in
        // calculateServerTiming(). Strip them so nothing downstream can
        // accidentally read the client-submitted values.
        unset($data['score'], $data['time_taken'], $data['remaining_time']);

        return $data;
    }

    /**
     * Derive authoritative time_taken / remaining_time from the session's
     * started_at timestamp and the current server clock. This is the
     * single source of truth for timing — nothing from the client feeds
     * into this calculation.
     *
     * @param GameSession $session
     * @return array{0: int, 1: int} [$timeTaken, $remainingTime]
     */
    private function calculateServerTiming(GameSession $session): array
    {
        $totalBudget = $this->totalGameDurationSeconds();

        // Defensive fallback: if started_at is somehow missing, treat the
        // whole budget as elapsed rather than dividing by/against null.
        $elapsedSeconds = $session->started_at
            ? $session->started_at->diffInSeconds(now())
            : $totalBudget;

        // Clamp: elapsed can't exceed the total budget (covers the case
        // where a completion request arrives late, e.g. after network
        // retry) and can't be negative.
        $timeTaken = max(0, min($elapsedSeconds, $totalBudget));

        $remainingTime = max(0, $totalBudget - $timeTaken);

        return [$timeTaken, $remainingTime];
    }

    /**
     * Total configured game duration across all levels, in seconds.
     * Adjust the config path below to match your actual game.php
     * levels structure if it differs (e.g. config('game.levels.*.duration')).
     *
     * @return int
     */
    private function totalGameDurationSeconds(): int
    {
        return (int) collect(config('game.levels'))->sum('duration');
    }

    /**
     * Calculate final game score. All rates are config-driven so
     * scoring can be tuned without touching code.
     *
     * @param int $matchedPairs
     * @param int $moves
     * @param int $remainingTime
     * @return int
     */
    private function calculateFinalScore(
        int $matchedPairs,
        int $moves,
        int $remainingTime
    ): int {

        $pointsPerPair = (int) config('game.scoring.points_per_pair');
        $timeBonusRate = (int) config('game.scoring.time_bonus_per_second');
        $movePenalty   = (int) config('game.scoring.move_penalty_per_extra');

        $baseScore = $matchedPairs * $pointsPerPair;

        $timeBonus = $remainingTime * $timeBonusRate;

        $penalty = max(
            0,
            ($moves - $matchedPairs) * $movePenalty
        );

        return max(
            0,
            $baseScore + $timeBonus - $penalty
        );
    }

    /**
     * Complete game session, persisting server-calculated timing rather
     * than any client-submitted values.
     *
     * @param GameSession $session
     * @param array $data
     * @param int $finalScore
     * @param int $timeTaken
     * @param int $remainingTime
     * @return GameSession
     */
    private function completeSession(
        GameSession $session,
        array $data,
        int $finalScore,
        int $timeTaken,
        int $remainingTime
    ): GameSession {

        $session->update([

            'status' => GameSession::STATUS_COMPLETED,

            'current_level' => $data['current_level'],

            'score' => $finalScore,

            'moves' => $data['moves'],

            'matched_pairs' => $data['matched_pairs'],

            'remaining_time' => $remainingTime,

            'time_taken' => $timeTaken,

            'completed_at' => now(),

        ]);

        return $session->fresh();
    }

    /**
     * Create game completion log. This is one of the whitelisted
     * "significant" events, so it is always logged.
     *
     * @param GameSession $session
     * @return void
     */
    private function createGameCompleteLog(GameSession $session): void
    {
        GameLog::create([

            'game_session_id' => $session->id,

            'event_type' => GameLog::EVENT_GAME_COMPLETED,

            'level' => $session->current_level,

            'score' => $session->score,

            'moves' => $session->moves,

            'matched_pairs' => $session->matched_pairs,

            'remaining_time' => $session->remaining_time,

            'description' => 'Game completed successfully.',

            'metadata' => [
                'completed_at' => $session->completed_at,
                'time_taken'   => $session->time_taken,
                'final_score'  => $session->score,
            ],

            'logged_at' => now(),

        ]);
    }

    /**
     * Create activity log for completed game.
     *
     * @param GameSession $session
     * @return void
     */
    private function createGameCompletedActivityLog(GameSession $session): void
    {
        $this->activityLogService->create(

            participant: $session->participant,

            activityType: ActivityLog::GAME_COMPLETED,

            title: 'Game Completed',

            description: 'Participant successfully completed the Memory Match Challenge.',

            metadata: [
                'game_session_uuid' => $session->uuid,
                'final_score'       => $session->score,
                'moves'             => $session->moves,
                'matched_pairs'     => $session->matched_pairs,
                'remaining_time'    => $session->remaining_time,
                'time_taken'        => $session->time_taken,
                'completed_at'      => $session->completed_at,
            ]

        );
    }
}