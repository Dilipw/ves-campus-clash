<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoryCard extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    public const STATUS_GENERATED  = 1;
    public const STATUS_DOWNLOADED = 2;
    public const STATUS_SHARED     = 3;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'participant_id',
        'game_session_id',
        'status',
        'download_count',
        'share_count',
        'generated_at',
        'downloaded_at',
        'shared_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'generated_at'  => 'datetime',
        'downloaded_at' => 'datetime',
        'shared_at'     => 'datetime',
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

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessor
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_GENERATED  => 'Generated',
            self::STATUS_DOWNLOADED => 'Downloaded',
            self::STATUS_SHARED     => 'Shared',

            default => 'Unknown',
        };
    }
}