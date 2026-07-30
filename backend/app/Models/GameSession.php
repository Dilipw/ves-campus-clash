<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class GameSession extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_REGISTERED = 1;
    public const STATUS_PLAYING    = 2;
    public const STATUS_COMPLETED  = 3;
    public const STATUS_EXPIRED    = 4;
    public const STATUS_ABANDONED  = 5;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'uuid',
        'participant_id',
        'current_level',
        'status',
        'score',
        'moves',
        'matched_pairs',
        'remaining_time',
        'time_taken',
        'started_at',
        'completed_at',
        'expires_at',
        'device_type',
        'browser',
        'operating_system',
        'ip_address',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'current_level'  => 'integer',
        'status'         => 'integer',
        'score'          => 'integer',
        'moves'          => 'integer',
        'matched_pairs'  => 'integer',
        'remaining_time' => 'integer',
        'time_taken'     => 'integer',

        'started_at'     => 'datetime',
        'completed_at'   => 'datetime',
        'expires_at'     => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Boot Method
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {

            if (blank($session->uuid)) {
                $session->uuid = (string) Str::uuid();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function participant()
    {
        return $this->belongsTo(Participant::class);
    }

    public function logs()
    {
        return $this->hasMany(GameLog::class);
    }

    /**
     * Single story card for this session. A player gets exactly
     * one attempt and one card (GDD: "one shot, one score"), so
     * hasOne matches the actual business rule.
     */
    public function storyCard()
    {
        return $this->hasOne(StoryCard::class);
    }

    /**
     * Kept for any existing code (e.g. admin listings) that needs
     * every story card row for this session, in case of retries
     * or regenerations at the DB level.
     */
    public function storyCards()
    {
        return $this->hasMany(StoryCard::class);
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

    public function isPlaying(): bool
    {
        return $this->status === self::STATUS_PLAYING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    public function isAbandoned(): bool
    {
        return $this->status === self::STATUS_ABANDONED;
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_REGISTERED => 'Registered',
            self::STATUS_PLAYING    => 'Playing',
            self::STATUS_COMPLETED  => 'Completed',
            self::STATUS_EXPIRED    => 'Expired',
            self::STATUS_ABANDONED  => 'Abandoned',

            default => 'Unknown',
        };
    }

    public function scopeRegistered($query)
    {
        return $query->where(
            'status',
            self::STATUS_REGISTERED
        );
    }

    public function scopePlaying($query)
    {
        return $query->where(
            'status',
            self::STATUS_PLAYING
        );
    }

    public function scopeCompleted($query)
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }
}