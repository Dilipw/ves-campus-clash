<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Participant;
use Illuminate\Http\Request;

class ActivityLogService
{
    /**
     * Store activity log.
     *
     * @param Participant|null $participant
     * @param int $activityType
     * @param string $title
     * @param string|null $description
     * @param array|null $metadata
     * @return ActivityLog
     */
    public function create(
        ?Participant $participant,
        int $activityType,
        string $title,
        ?string $description = null,
        ?array $metadata = null
    ): ActivityLog {

        $request = request();

        return ActivityLog::create([

            'participant_id' => $participant?->id,

            'activity_type' => $activityType,

            'title' => $title,

            'description' => $description,

            'ip_address' => $request->ip(),

            'device_type' => $this->deviceType($request),

            'browser' => $request->userAgent(),

            'operating_system' => php_uname('s'),

            'metadata' => $metadata,

            'logged_at' => now(),

        ]);
    }

    /**
     * Detect device type.
     */
    private function deviceType(Request $request): string
    {
        $agent = strtolower($request->userAgent());

        if (str_contains($agent, 'mobile')) {
            return 'Mobile';
        }

        if (str_contains($agent, 'tablet')) {
            return 'Tablet';
        }

        return 'Desktop';
    }
}