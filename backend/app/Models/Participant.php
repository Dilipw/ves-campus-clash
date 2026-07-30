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

    public function gameSessions()
    {
        return $this->hasMany(GameSession::class);
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
