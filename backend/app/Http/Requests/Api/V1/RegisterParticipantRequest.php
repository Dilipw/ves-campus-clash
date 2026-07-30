<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class RegisterParticipantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation Rules
     */
    public function rules(): array
    {
        return [

            'full_name' => [
                'required',
                'string',
                'min:3',
                'max:150',
            ],

            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'instagram_handle' => [
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[A-Za-z0-9._]+$/',
            ],

            'institute' => [
                'required',
                'string',
                'max:150',
            ],

            'course' => [
                'required',
                'string',
                'max:100',
            ],

            'academic_year' => [
                'required',
                'string',
                'max:30',
            ],

            'follow_confirmed' => [
                'required',
                'boolean',
            ],

        ];
    }

    /**
     * Custom Validation Messages
     */
    public function messages(): array
    {
        return [

            'full_name.required' => 'Full name is required.',

            'profile_photo.image' => 'Profile photo must be an image.',

            'profile_photo.mimes' => 'Profile photo must be a JPG, JPEG, PNG or WEBP image.',

            'profile_photo.max' => 'Profile photo size must not exceed 2 MB.',

            'instagram_handle.required' => 'Instagram username is required.',

            'instagram_handle.regex' => 'Enter a valid Instagram username.',

            'institute.required' => 'Institute name is required.',

            'course.required' => 'Course is required.',

            'academic_year.required' => 'Academic year is required.',

            'follow_confirmed.required' => 'Please confirm that you followed the Instagram page.',

        ];
    }

    /**
     * Prepare Data Before Validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            'instagram_handle' => ltrim(trim($this->instagram_handle), '@'),

            'full_name' => trim($this->full_name),

            'institute' => trim($this->institute),

            'course' => trim($this->course),

            'academic_year' => trim($this->academic_year),

        ]);
    }
}