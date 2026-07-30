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

            'game_session_uuid' => $this->uuid,

            'participant_uuid' => $this->participant->uuid,

            'participant_name' => $this->participant->full_name,

            'score' => $this->score,

            'moves' => $this->moves,

            'matched_pairs' => $this->matched_pairs,

            'time_taken' => $this->time_taken,

            'remaining_time' => $this->remaining_time,

            'completed_at' => $this->completed_at,

            'story_card_available' => true,

        ];
    }
}