<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Participant extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_REGISTERED      = 1;
    public const STATUS_GAME_STARTED    = 2;
    public const STATUS_GAME_COMPLETED  = 3;
    public const STATUS_DISQUALIFIED    = 4;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'uuid',
        'full_name',
        'profile_photo_path',
        'instagram_handle',
        'institute',
        'course',
        'academic_year',
        'follow_confirmed',
        'registration_source',
        'status',
        'registered_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Type Casting
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'follow_confirmed' => 'boolean',
        'registered_at'    => 'datetime',
        'status'           => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Boot Method
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($participant) {
            if (empty($participant->uuid)) {
                $participant->uuid = (string) Str::uuid();
            }

            if (empty($participant->registered_at)) {
                $participant->registered_at = now();
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
        return $this->hasOne(GameSession::class);
    }

    public function storyCards()
    {
        return $this->hasMany(StoryCard::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    public function isRegistered(): bool
    {
        return $this->status === self::STATUS_REGISTERED;
    }

    public function hasStartedGame(): bool
    {
        return $this->status === self::STATUS_GAME_STARTED;
    }

    public function hasCompletedGame(): bool
    {
        return $this->status === self::STATUS_GAME_COMPLETED;
    }

    public function isDisqualified(): bool
    {
        return $this->status === self::STATUS_DISQUALIFIED;
    }

    /*
    |--------------------------------------------------------------------------
    | Status Label
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_REGISTERED     => 'Registered',
            self::STATUS_GAME_STARTED   => 'Game Started',
            self::STATUS_GAME_COMPLETED => 'Game Completed',
            self::STATUS_DISQUALIFIED   => 'Disqualified',
            default                     => 'Unknown',
        };
    }
}