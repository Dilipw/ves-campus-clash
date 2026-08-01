<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class GameConfigController extends Controller
{
    /**
     * Return level structure so the frontend can build its board/timer
     * without hardcoding a LEVELS constant that can drift out of sync
     * with config/game.php. Single source of truth: config('game.levels').
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        $pairsByLevel    = config('game.levels.pairs_by_level', []);
        $durationByLevel = config('game.levels.duration_by_level', []);
        $colsByLevel     = config('game.levels.cols_by_level', []);
        $maxLevel        = (int) config('game.levels.max_level');

        $levels = [];
        for ($level = 1; $level <= $maxLevel; $level++) {
            $levels[] = [
                'level'    => $level,
                'pairs'    => (int) ($pairsByLevel[$level] ?? 0),
                'duration' => (int) ($durationByLevel[$level] ?? 0),
                'cols'     => (int) ($colsByLevel[$level] ?? 4),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Game config fetched successfully.',
            'data' => [
                'levels' => $levels,
                'total_budget_seconds' => array_sum($durationByLevel),
            ],
        ]);
    }
}