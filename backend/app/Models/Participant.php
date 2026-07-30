<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Participant extends Model
{
    use HasFactory, SoftDeletes;


    /*
    |--------------------------------------------------------------------------
    | Mass Assignable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'uuid',
        'full_name',
        'profile_photo',
        'instagram_handle',
        'institute',
        'course',
        'academic_year',
        'follow_confirmed',
        'registration_source',
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

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function gameSession(): HasOne
    {
        return $this->hasOne(GameSession::class)->latestOfMany();
    }
    public function storyCards()
    {
        return $this->hasMany(StoryCard::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
