<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Activity Types
    |--------------------------------------------------------------------------
    */

    public const LANDING_PAGE       = 1;
    public const FOLLOW_CONFIRMED   = 2;
    public const REGISTRATION       = 3;
    public const GAME_STARTED       = 4;
    public const GAME_COMPLETED     = 5;
    public const STORY_VIEWED       = 6;
    public const STORY_DOWNLOADED   = 7;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'participant_id',
        'activity_type',
        'title',
        'description',
        'ip_address',
        'device_type',
        'browser',
        'operating_system',
        'metadata',
        'logged_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'metadata'  => 'array',
        'logged_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function participant()
    {
        return $this->belongsTo(Participant::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessor
    |--------------------------------------------------------------------------
    */

    public function getActivityLabelAttribute(): string
    {
        return match ($this->activity_type) {

            self::LANDING_PAGE      => 'Landing Page',
            self::FOLLOW_CONFIRMED  => 'Follow Confirmed',
            self::REGISTRATION      => 'Registration',
            self::GAME_STARTED      => 'Game Started',
            self::GAME_COMPLETED    => 'Game Completed',
            self::STORY_VIEWED      => 'Story Viewed',
            self::STORY_DOWNLOADED  => 'Story Downloaded',

            default => 'Unknown',
        };
    }
}