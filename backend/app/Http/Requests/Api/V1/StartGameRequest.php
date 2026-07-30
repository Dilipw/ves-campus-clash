<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StartGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'game_session_uuid' => [
                'required',
                'uuid',
                'exists:game_sessions,uuid',
            ],

        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'game_session_uuid.required' => 'Game session ID is required.',

            'game_session_uuid.uuid' => 'Invalid game session ID.',

            'game_session_uuid.exists' => 'Game session not found.',

        ];
    }

    /**
     * Prepare request before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('game_session_uuid')) {
            $this->merge([
                'game_session_uuid' => trim((string) $this->game_session_uuid),
            ]);
        }
    }
}