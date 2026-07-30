<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Game Session
            |--------------------------------------------------------------------------
            */

            'game_session_uuid' => $this->uuid,

            'status' => [
                'id' => $this->status,
                'label' => $this->status_label,
            ],

            /*
            |--------------------------------------------------------------------------
            | Participant
            |--------------------------------------------------------------------------
            */

            'participant' => [

                'uuid' => $this->participant->uuid,

                'full_name' => $this->participant->full_name,

                'profile_photo' => $this->participant->profile_photo,

                'instagram_handle' => $this->participant->instagram_handle,

            ],

            /*
            |--------------------------------------------------------------------------
            | Result
            |--------------------------------------------------------------------------
            */

            'result' => [

                'score' => $this->score,

                'moves' => $this->moves,

                'matched_pairs' => $this->matched_pairs,

                'time_taken' => $this->time_taken,

                'remaining_time' => $this->remaining_time,

                'current_level' => $this->current_level,

                'completed_at' => $this->completed_at,

            ],

            /*
            |--------------------------------------------------------------------------
            | Story Card
            |--------------------------------------------------------------------------
            */

            'story_card' => [

                'available' => true,

                'downloaded' => $this->storyCard?->downloaded_at !== null,

            ],

        ];
    }
}