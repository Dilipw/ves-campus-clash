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

class GameStartService
{
    use ResolvesGameSession;

    public function __construct(
        protected ActivityLogService $activityLogService
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
        DB::beginTransaction();

        try {

            $session = $this->findGameSession(
                $data['game_session_uuid']
            );

            $this->validateStartable(
                $session
            );

            $session = $this->startSession(
                $session
            );

            $this->createGameLog(
                $session
            );

            $this->createActivityLog(
                $session
            );

            DB::commit();

            return $session;
        } catch (BusinessException $exception) {

            DB::rollBack();

            throw $exception;
        } catch (Throwable $exception) {

            DB::rollBack();

            Log::error('Game start failed.', [
                'message' => $exception->getMessage(),
                'file'    => $exception->getFile(),
                'line'    => $exception->getLine(),
                'trace'   => $exception->getTraceAsString(),
            ]);

            throw new BusinessException(
                'Unable to start the game.'
            );
        }
    }

    /**
     * Start game session.
     * All timer/state defaults come from config, not hardcoded.
     *
     * @param GameSession $session
     * @return GameSession
     */
    private function startSession(GameSession $session): GameSession
    {
        $session->update([

            'status' => GameSession::STATUS_PLAYING,

            'current_level' => 1,

            'score' => 0,

            'moves' => 0,

            'matched_pairs' => 0,

            'remaining_time' => config('game.timer.initial_seconds'),

            'time_taken' => 0,

            'started_at' => now(),

        ]);

        return $session->fresh();
    }

    /**
     * Create game start log. This is one of the whitelisted
     * "significant" events, so it is always logged.
     *
     * @param GameSession $session
     * @return void
     */
    private function createGameLog(GameSession $session): void
    {
        GameLog::create([

            'game_session_id' => $session->id,

            'level' => $session->current_level,

            'event_type' => GameLog::EVENT_GAME_STARTED,

            'score' => $session->score,

            'moves' => $session->moves,

            'matched_pairs' => $session->matched_pairs,

            'remaining_time' => $session->remaining_time,

            'description' => 'Game session started.',

            'logged_at' => now(),

        ]);
    }

    /**
     * Create activity log for game start.
     *
     * @param GameSession $session
     * @return void
     */
    private function createActivityLog(GameSession $session): void
    {
        $this->activityLogService->create(

            participant: $session->participant,

            activityType: ActivityLog::GAME_STARTED,

            title: 'Game Started',

            description: 'Participant started the memory match challenge.',

            metadata: [
                'game_session_uuid' => $session->uuid,
                'current_level'     => $session->current_level,
                'score'             => $session->score,
                'remaining_time'    => $session->remaining_time,
                'started_at'        => $session->started_at,
            ]

        );
    }
}