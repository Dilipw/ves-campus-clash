<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CompleteGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation Rules.
     */
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

    /**
     * Validation Messages.
     */
    public function messages(): array
    {
        return [

            'game_session_uuid.required' => 'Game session is required.',

            'game_session_uuid.uuid' => 'Invalid game session.',

        ];
    }

    /**
     * Prepare Data.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            'game_session_uuid' => trim(
                $this->game_session_uuid
            ),

        ]);
    }
}