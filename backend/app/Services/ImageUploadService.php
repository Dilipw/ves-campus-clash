<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService
{
    /**
     * Upload participant profile photo.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @return string
     */
    public function uploadParticipantPhoto(
        UploadedFile $file,
        string $directory = 'participants'
    ): string {

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        return $file->storeAs(
            $directory,
            $filename,
            'public'
        );
    }

    /**
     * Delete uploaded file.
     */
    public function delete(?string $path): void
    {
        if (!$path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {

            Storage::disk('public')->delete($path);
        }
    }
}
