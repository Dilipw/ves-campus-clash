<?php

namespace App\Services;

use Throwable;
use App\Models\GameLog;
use App\Models\Participant;
use App\Models\GameSession;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\BusinessException;

class GameService
{
    /**
     * Constructor.
     */
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

            /*
        |--------------------------------------------------------------------------
        | Find Game Session
        |--------------------------------------------------------------------------
        */

            $session = $this->findGameSession(
                $data['game_session_uuid']
            );

            /*
        |--------------------------------------------------------------------------
        | Validate Session
        |--------------------------------------------------------------------------
        */

            $this->validateSession(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Start Session
        |--------------------------------------------------------------------------
        */

            $session = $this->startSession(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Create Game Log
        |--------------------------------------------------------------------------
        */

            $this->createGameLog(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Create Activity Log
        |--------------------------------------------------------------------------
        */

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

                'file' => $exception->getFile(),

                'line' => $exception->getLine(),

                'trace' => $exception->getTraceAsString(),

            ]);

            throw new BusinessException(
                'Unable to start the game.'
            );
        }
    }

    /**
     * Find game session by UUID.
     *
     * @param string $gameSessionUuid
     * @return GameSession
     *
     * @throws BusinessException
     */
    private function findGameSession(string $gameSessionUuid): GameSession
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
     * Validate game session before starting.
     *
     * @param GameSession $session
     * @return void
     *
     * @throws BusinessException
     */
    private function validateSession(GameSession $session): void
    {
        /*
    |--------------------------------------------------------------------------
    | Already Completed
    |--------------------------------------------------------------------------
    */

        if ($session->isCompleted()) {

            throw new BusinessException(
                'You have already completed this game.',
                409
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Session Expired
    |--------------------------------------------------------------------------
    */

        if ($session->isExpired()) {

            throw new BusinessException(
                'Your game session has expired.',
                410
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Session Abandoned
    |--------------------------------------------------------------------------
    */

        if ($session->isAbandoned()) {

            throw new BusinessException(
                'This game session is no longer available.',
                410
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Already Playing
    |--------------------------------------------------------------------------
    */

        if ($session->isPlaying()) {

            throw new BusinessException(
                'Game has already been started.',
                409
            );
        }
    }

    /**
     * Start game session.
     *
     * @param GameSession $session
     * @return GameSession
     */
    private function startSession(
        GameSession $session
    ): GameSession {

        $session->update([

            'status' => GameSession::STATUS_PLAYING,

            'current_level' => 1,

            'score' => 0,

            'moves' => 0,

            'matched_pairs' => 0,

            'remaining_time' => 120,

            'time_taken' => 0,

            'started_at' => now(),

        ]);

        return $session->fresh();
    }
    /**
     * Create game start log.
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

                'current_level' => $session->current_level,

                'score' => $session->score,

                'remaining_time' => $session->remaining_time,

                'started_at' => $session->started_at,

            ]

        );
    }
}
