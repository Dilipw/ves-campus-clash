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

    public const EVENT_GAME_STARTED    = 1;
    public const EVENT_LEVEL_COMPLETED = 2;
    public const EVENT_MATCH_FOUND     = 3;
    public const EVENT_MISMATCH        = 4;
    public const EVENT_GAME_COMPLETED  = 5;
    public const EVENT_GAME_EXPIRED    = 6;
    public const EVENT_GAME_ABANDONED  = 7;

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
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected $casts = [

        'event_type'     => 'integer',
        'level'          => 'integer',
        'score'          => 'integer',
        'moves'          => 'integer',
        'matched_pairs'  => 'integer',
        'remaining_time' => 'integer',

        'metadata'       => 'array',

        'logged_at'      => 'datetime',

    ];

    /*
    |--------------------------------------------------------------------------
    | Boot Method
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {

            if (blank($log->logged_at)) {
                $log->logged_at = now();
            }

        });
    }

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
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    public function isGameStarted(): bool
    {
        return $this->event_type === self::EVENT_GAME_STARTED;
    }

    public function isLevelCompleted(): bool
    {
        return $this->event_type === self::EVENT_LEVEL_COMPLETED;
    }

    public function isGameCompleted(): bool
    {
        return $this->event_type === self::EVENT_GAME_COMPLETED;
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getEventLabelAttribute(): string
    {
        return match ($this->event_type) {

            self::EVENT_GAME_STARTED    => 'Game Started',

            self::EVENT_LEVEL_COMPLETED => 'Level Completed',

            self::EVENT_MATCH_FOUND     => 'Match Found',

            self::EVENT_MISMATCH        => 'Mismatch',

            self::EVENT_GAME_COMPLETED  => 'Game Completed',

            self::EVENT_GAME_EXPIRED    => 'Game Expired',

            self::EVENT_GAME_ABANDONED  => 'Game Abandoned',

            default => 'Unknown',

        };
    }
}