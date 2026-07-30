<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GameLog extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Event Types
    |--------------------------------------------------------------------------
    */

    public const GAME_STARTED      = 1;
    public const LEVEL_COMPLETED   = 2;
    public const POWER_UP          = 3;
    public const GAME_COMPLETED    = 4;
    public const SESSION_EXPIRED   = 5;
    public const SESSION_ABANDONED = 6;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'game_session_id',
        'event_type',
        'level',
        'score',
        'moves',
        'matched_pairs',
        'remaining_time',
        'description',
        'metadata',
        'logged_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'metadata'   => 'array',
        'logged_at'  => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessor
    |--------------------------------------------------------------------------
    */

    public function getEventLabelAttribute(): string
    {
        return match ($this->event_type) {

            self::GAME_STARTED      => 'Game Started',
            self::LEVEL_COMPLETED   => 'Level Completed',
            self::POWER_UP          => 'Power Up',
            self::GAME_COMPLETED    => 'Game Completed',
            self::SESSION_EXPIRED   => 'Session Expired',
            self::SESSION_ABANDONED => 'Session Abandoned',

            default => 'Unknown',
        };
    }
}
