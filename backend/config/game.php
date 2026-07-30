<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Timer
    |--------------------------------------------------------------------------
    */

    'timer' => [
        'initial_seconds' => env('GAME_INITIAL_TIME_SECONDS', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Scoring Rules
    |--------------------------------------------------------------------------
    */

    'scoring' => [
        'points_per_pair'          => env('GAME_POINTS_PER_PAIR', 100),
        'time_bonus_per_second'    => env('GAME_TIME_BONUS_PER_SECOND', 5),
        'move_penalty_per_extra'   => env('GAME_MOVE_PENALTY_PER_EXTRA', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Levels
    |--------------------------------------------------------------------------
    | These bound what the client is allowed to report during progress
    | updates so a manipulated payload can't fast-forward the session.
    */

    'levels' => [
        'max_level'       => env('GAME_MAX_LEVEL', 10),
        'max_pairs_level' => env('GAME_MAX_PAIRS_PER_LEVEL', 8),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    | Only these event types generate a GameLog row. Every progress tick
    | still updates the game_sessions row, but we don't want a log entry
    | for every single move/tick - only for meaningful milestones.
    */

    'loggable_events' => [
        'game_started',
        'level_completed',
        'game_completed',
    ],

];