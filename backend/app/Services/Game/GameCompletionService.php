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

class GameCompletionService
{
    use ResolvesGameSession;

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

            $finalScore = $this->calculateFinalScore(
                matchedPairs: $data['matched_pairs'],
                moves: $data['moves'],
                remainingTime: $data['remaining_time']
            );

            $session = $this->completeSession(
                $session,
                $data,
                $finalScore
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
     * state. Same non-regression guarantees as progress updates.
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

        // Score is always computed below - never trust the client value.
        unset($data['score']);

        return $data;
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
     * Complete game session.
     *
     * @param GameSession $session
     * @param array $data
     * @param int $finalScore
     * @return GameSession
     */
    private function completeSession(
        GameSession $session,
        array $data,
        int $finalScore
    ): GameSession {

        $session->update([

            'status' => GameSession::STATUS_COMPLETED,

            'current_level' => $data['current_level'],

            'score' => $finalScore,

            'moves' => $data['moves'],

            'matched_pairs' => $data['matched_pairs'],

            'remaining_time' => $data['remaining_time'],

            'time_taken' => $data['time_taken'],

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