<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImageController extends Controller
{
    public function show(Request $request, string $path): StreamedResponse
    {
        // Decode URL
        $path = urldecode($path);

        // Security: Prevent directory traversal
        if (str_contains($path, '..')) {
            abort(403, 'Invalid file path.');
        }

        // Check file exists
        if (! Storage::disk('public')->exists($path)) {
            abort(404, 'Image not found.');
        }

        // Stream file response
        return Storage::disk('public')->response(
            $path,
            basename($path),
            [
                'Cache-Control' => 'public, max-age=86400',
            ]
        );
    }
}
