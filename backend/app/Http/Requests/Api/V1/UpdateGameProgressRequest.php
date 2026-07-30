<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'game_session_uuid' => [
                'required',
                'uuid',
            ],

            'current_level' => [
                'required',
                'integer',
                'min:1',
                'max:2',
            ],

            'score' => [
                'required',
                'integer',
                'min:0',
            ],

            'moves' => [
                'required',
                'integer',
                'min:0',
            ],

            'matched_pairs' => [
                'required',
                'integer',
                'min:0',
            ],

            'remaining_time' => [
                'required',
                'integer',
                'min:0',
            ],

            'time_taken' => [
                'required',
                'integer',
                'min:0',
            ],

        ];
    }

    public function messages(): array
    {
        return [

            'game_session_uuid.required' => 'Game session is required.',

            'game_session_uuid.uuid' => 'Invalid game session.',

        ];
    }
}