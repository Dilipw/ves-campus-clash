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

            'participant_uuid' => [
                'required',
                'uuid',
            ],

        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'participant_uuid.required' => 'Participant ID is required.',

            'participant_uuid.uuid' => 'Invalid participant ID.',

        ];
    }

    /**
     * Prepare request before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            'participant_uuid' => trim(
                $this->participant_uuid
            ),

        ]);
    }
}