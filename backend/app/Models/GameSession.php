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
    | Status
    |--------------------------------------------------------------------------
    */

    public const STATUS_STARTED           = 1;
    public const STATUS_LEVEL_1_COMPLETED = 2;
    public const STATUS_LEVEL_2_COMPLETED = 3;
    public const STATUS_COMPLETED         = 4;
    public const STATUS_EXPIRED           = 5;
    public const STATUS_ABANDONED         = 6;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'uuid',
        'participant_id',
        'game_name',
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
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'expires_at'   => 'datetime',
        'score'        => 'integer',
        'moves'        => 'integer',
        'matched_pairs'=> 'integer',
        'current_level'=> 'integer',
        'status'       => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {

            if (empty($session->uuid)) {
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

    public function storyCard()
    {
        return $this->hasOne(StoryCard::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

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
    | Status Label
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_STARTED           => 'Started',
            self::STATUS_LEVEL_1_COMPLETED => 'Level 1 Completed',
            self::STATUS_LEVEL_2_COMPLETED => 'Level 2 Completed',
            self::STATUS_COMPLETED         => 'Completed',
            self::STATUS_EXPIRED           => 'Expired',
            self::STATUS_ABANDONED         => 'Abandoned',

            default => 'Unknown',
        };
    }
}