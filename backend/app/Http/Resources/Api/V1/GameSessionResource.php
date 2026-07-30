<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'uuid' => $this->uuid,

            'participant_uuid' => $this->participant?->uuid,

            'status' => [
                'id' => $this->status,
                'label' => $this->status_label,
            ],

            'current_level' => $this->current_level,

            'score' => $this->score,

            'moves' => $this->moves,

            'matched_pairs' => $this->matched_pairs,

            'remaining_time' => $this->remaining_time,

            'time_taken' => $this->time_taken,

            'started_at' => $this->started_at,

            'completed_at' => $this->completed_at,

        ];
    }
}