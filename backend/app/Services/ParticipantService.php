<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\ActivityLog;
use App\Models\GameSession;
use App\Models\Participant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ParticipantService
{
    /**
     * Constructor.
     */
    public function __construct(
        protected ImageUploadService $imageUploadService,
        protected ActivityLogService $activityLogService
    ) {}

    /**
     * Register a new participant.
     *
     * @param array $data
     * @return Participant
     *
     * @throws BusinessException
     */
    public function register(array $data): Participant
    {
        DB::beginTransaction();

        try {

            /*
        |--------------------------------------------------------------------------
        | Validate Business Rules
        |--------------------------------------------------------------------------
        */
            $this->validateInstagramHandle(
                $data['instagram_handle']
            );

            /*
        |--------------------------------------------------------------------------
        | Upload Profile Photo
        |--------------------------------------------------------------------------
        */
            $profilePhoto = $this->uploadProfilePhoto($data);

            /*
        |--------------------------------------------------------------------------
        | Create Participant
        |--------------------------------------------------------------------------
        */
            $participant = $this->createParticipant(
                $data,
                $profilePhoto
            );

            /*
        |--------------------------------------------------------------------------
        | Create Initial Game Session
        |--------------------------------------------------------------------------
        */
            $this->createGameSession(
                $participant
            );

            /*
        |--------------------------------------------------------------------------
        | Create Activity Log
        |--------------------------------------------------------------------------
        */
            $this->createActivityLog(
                $participant
            );

            DB::commit();

            return $participant;
        } catch (BusinessException $exception) {

            DB::rollBack();

            throw $exception;
        } catch (Throwable $exception) {

            DB::rollBack();

            Log::error('Participant registration failed.', [

                'message' => $exception->getMessage(),

                'file' => $exception->getFile(),

                'line' => $exception->getLine(),

                'trace' => $exception->getTraceAsString(),

            ]);

            throw new BusinessException(
                'Unable to register participant. Please try again later.'
            );
        }
    }

    /**
     * Validate participant Instagram handle.
     *
     * @param string $instagramHandle
     * @return void
     *
     * @throws BusinessException
     */
    private function validateInstagramHandle(string $instagramHandle): void
    {
        $exists = Participant::query()
            ->where('instagram_handle', $instagramHandle)
            ->exists();

        if ($exists) {
            throw new BusinessException(
                'This Instagram handle is already registered.'
            );
        }
    }

    /**
     * Upload participant profile photo.
     *
     * @param array $data
     * @return string|null
     */
    private function uploadProfilePhoto(array $data): ?string
    {
        if (
            !isset($data['profile_photo']) ||
            !$data['profile_photo']
        ) {
            return null;
        }

        return $this->imageUploadService->uploadParticipantPhoto(
            $data['profile_photo']
        );
    }

    /**
     * Create participant.
     *
     * @param array $data
     * @param string|null $profilePhoto
     * @return Participant
     */
    private function createParticipant(
        array $data,
        ?string $profilePhoto
    ): Participant {

        return Participant::create([

            'full_name'            => $data['full_name'],

            'profile_photo_path'   => $profilePhoto,

            'instagram_handle'     => strtolower($data['instagram_handle']),

            'institute'            => $data['institute'],

            'course'               => $data['course'],

            'academic_year'        => $data['academic_year'],

            'follow_confirmed'     => $data['follow_confirmed'],

            'registration_source'  => $data['registration_source'] ?? 'QR',

        ]);
    }

    /**
     * Create initial game session.
     *
     * @param Participant $participant
     * @return GameSession
     */
    private function createGameSession(
        Participant $participant
    ): GameSession {

        return GameSession::create([

            'participant_id' => $participant->id,

            'current_level' => 1,

            'status' => GameSession::STATUS_REGISTERED,

            'score' => 0,

            'moves' => 0,

            'matched_pairs' => 0,

            'remaining_time' => 0,

            'time_taken' => 0,

            'started_at' => null,

            'completed_at' => null,

            'expires_at' => null,

            'device_type' => request()->header('X-Device-Type'),

            'browser' => request()->userAgent(),

            'operating_system' => null,

            'ip_address' => request()->ip(),

        ]);
    }

    /**
     * Create participant registration activity log.
     *
     * @param Participant $participant
     * @return void
     */
    private function createActivityLog(
        Participant $participant
    ): void {

        $this->activityLogService->create(

            participant: $participant,

            activityType: ActivityLog::REGISTRATION,

            title: 'Participant Registered',

            description: 'Participant successfully completed registration.',

            metadata: [

                'participant_uuid' => $participant->uuid,

                'instagram_handle' => $participant->instagram_handle,

                'registered_at' => $participant->registered_at,

            ]

        );
    }
}
