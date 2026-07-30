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
        | Validate Playing Session
        |--------------------------------------------------------------------------
        */

            $this->validatePlayingSession(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Update Game Progress
        |--------------------------------------------------------------------------
        */

            $session = $this->updateProgress(
                $session,
                $data
            );

            /*
        |--------------------------------------------------------------------------
        | Create Game Log
        |--------------------------------------------------------------------------
        */

            $this->createProgressLog(
                $session
            );

            DB::commit();

            return $session->fresh();
        } catch (BusinessException $exception) {

            DB::rollBack();

            throw $exception;
        } catch (Throwable $exception) {

            DB::rollBack();

            Log::error('Unable to save game progress.', [

                'message' => $exception->getMessage(),

                'file' => $exception->getFile(),

                'line' => $exception->getLine(),

                'trace' => $exception->getTraceAsString(),

            ]);

            throw new BusinessException(
                'Unable to save game progress.'
            );
        }
    }

    /**
     * Validate active game session before saving progress.
     *
     * @param GameSession $session
     * @return void
     *
     * @throws BusinessException
     */
    private function validatePlayingSession(GameSession $session): void
    {
        /*
    |--------------------------------------------------------------------------
    | Session Completed
    |--------------------------------------------------------------------------
    */

        if ($session->isCompleted()) {

            throw new BusinessException(
                'This game has already been completed.',
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
                'This game session has been abandoned.',
                410
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Session Not Started
    |--------------------------------------------------------------------------
    */

        if (! $session->isPlaying()) {

            throw new BusinessException(
                'Game has not been started yet.',
                409
            );
        }
    }
    /**
     * Update game session progress.
     *
     * @param GameSession $session
     * @param array $data
     * @return GameSession
     */
    private function updateProgress(
        GameSession $session,
        array $data
    ): GameSession {

        $session->update([

            'current_level' => $data['current_level'],

            'score' => $data['score'],

            'moves' => $data['moves'],

            'matched_pairs' => $data['matched_pairs'],

            'remaining_time' => $data['remaining_time'],

            'time_taken' => $data['time_taken'],

        ]);

        return $session->fresh();
    }

    /**
     * Create game progress log.
     *
     * @param GameSession $session
     * @return void
     */
    private function createProgressLog(GameSession $session): void
    {
        GameLog::create([

            'game_session_id' => $session->id,

            'level' => $session->current_level,

            'event_type' => GameLog::EVENT_PROGRESS_UPDATED,

            'score' => $session->score,

            'moves' => $session->moves,

            'matched_pairs' => $session->matched_pairs,

            'remaining_time' => $session->remaining_time,

            'description' => 'Game progress updated.',

            'logged_at' => now(),

        ]);
    }

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

            $this->validatePlayingSession(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Calculate Final Score
        |--------------------------------------------------------------------------
        */

            $finalScore = $this->calculateFinalScore(
                matchedPairs: $data['matched_pairs'],
                moves: $data['moves'],
                remainingTime: $data['remaining_time']
            );

            /*
        |--------------------------------------------------------------------------
        | Complete Session
        |--------------------------------------------------------------------------
        */

            $session = $this->completeSession(
                $session,
                $data,
                $finalScore
            );

            /*
        |--------------------------------------------------------------------------
        | Create Game Complete Log
        |--------------------------------------------------------------------------
        */

            $this->createGameCompleteLog(
                $session
            );

            /*
        |--------------------------------------------------------------------------
        | Create Activity Log
        |--------------------------------------------------------------------------
        */

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
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),

            ]);

            throw new BusinessException(
                'Unable to complete the game.'
            );
        }
    }

    /**
     * Calculate final game score.
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

        /*
    |--------------------------------------------------------------------------
    | Base Score
    |--------------------------------------------------------------------------
    */

        $baseScore = $matchedPairs * 100;

        /*
    |--------------------------------------------------------------------------
    | Time Bonus
    |--------------------------------------------------------------------------
    */

        $timeBonus = $remainingTime * 5;

        /*
    |--------------------------------------------------------------------------
    | Move Penalty
    |--------------------------------------------------------------------------
    */

        $movePenalty = max(
            0,
            ($moves - $matchedPairs) * 5
        );

        /*
    |--------------------------------------------------------------------------
    | Final Score
    |--------------------------------------------------------------------------
    */

        return max(
            0,
            $baseScore + $timeBonus - $movePenalty
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
     * Create game completion log.
     *
     * @param GameSession $session
     * @return void
     */
    private function createGameCompleteLog(
        GameSession $session
    ): void {

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

                'time_taken' => $session->time_taken,

                'final_score' => $session->score,

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
    private function createGameCompletedActivityLog(
        GameSession $session
    ): void {

        $this->activityLogService->create(

            participant: $session->participant,

            activityType: ActivityLog::GAME_COMPLETED,

            title: 'Game Completed',

            description: 'Participant successfully completed the Memory Match Challenge.',

            metadata: [

                'game_session_uuid' => $session->uuid,

                'final_score' => $session->score,

                'moves' => $session->moves,

                'matched_pairs' => $session->matched_pairs,

                'remaining_time' => $session->remaining_time,

                'time_taken' => $session->time_taken,

                'completed_at' => $session->completed_at,

            ]

        );
    }
}
