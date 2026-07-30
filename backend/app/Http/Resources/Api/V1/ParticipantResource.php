<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'uuid' => $this->uuid,

            'full_name' => $this->full_name,

            'profile_photo' => $this->profile_photo
                ? asset('storage/'.$this->profile_photo)
                : null,

            'instagram_handle' => '@'.$this->instagram_handle,

            'institute' => $this->institute,

            'course' => $this->course,

            'academic_year' => $this->academic_year,

            'follow_confirmed' => $this->follow_confirmed,

            'registered_at' => $this->registered_at,

            'game_session' => [

                'uuid' => optional($this->gameSessions()->latest()->first())->uuid,

                'status' => optional($this->gameSessions()->latest()->first())->status_label,

            ]

        ];
    }
}