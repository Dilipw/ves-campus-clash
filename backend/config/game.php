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
    |
    | max_pairs_level is kept only for backward compatibility — it is no
    | longer read by GameProgressService's pair-limit check. That check
    | now uses pairs_by_level below to compute a CUMULATIVE cap per level
    | (e.g. by level 2, matched_pairs should be at most 8 + 10 = 18),
    | since matched_pairs is tracked as a running total across the whole
    | session and never resets between levels.
    |
    | pairs_by_level MUST match the LEVELS array in the React frontend
    | (GamePage.jsx) exactly — level number => that level's pair count.
    | If you add a level 3 in the frontend, add it here too, and bump
    | max_level to match — otherwise the backend will reject progress
    | past level 2 with "Invalid level."
    */

    'levels' => [
        'max_level'       => env('GAME_MAX_LEVEL', 2),
        'max_pairs_level' => env('GAME_MAX_PAIRS_PER_LEVEL', 8),

        'pairs_by_level' => [
            1 => 8,
            2 => 10,
        ],
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