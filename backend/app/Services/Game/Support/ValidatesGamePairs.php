<?php

namespace App\Services\Game\Support;

trait ValidatesGamePairs
{
    /**
     * The maximum matched_pairs value that is valid once a player has
     * reached the given level — i.e. the sum of every level's pair
     * count from level 1 up to and including this one.
     *
     * Example, with pairs_by_level = [1 => 8, 2 => 10]:
     *   level 1 -> cap is 8
     *   level 2 -> cap is 8 + 10 = 18
     *
     * @param int $currentLevel
     * @return int
     */
    protected function cumulativePairsCapForLevel(int $currentLevel): int
    {
        $pairsByLevel = config('game.levels.pairs_by_level', []);

        $cap = 0;

        foreach ($pairsByLevel as $level => $pairs) {
            if ((int) $level <= $currentLevel) {
                $cap += (int) $pairs;
            }
        }

        return $cap;
    }
}