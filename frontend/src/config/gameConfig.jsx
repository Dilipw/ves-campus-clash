/**
 * VES Campus Clash — Game Model
 * -----------------------------------------------------------------------
 * Single source of truth for level structure, timers, grid sizes, and
 * scoring rules, taken directly from the Game Design Doc.
 *
 * Every component that needs to know "how many pairs are in Level 2" or
 * "what's the timer for Level 1" should import from here — not hardcode
 * the number again. StoryCard, ResultPage, and the game engine itself
 * all read from this file so they can never drift out of sync.
 * -----------------------------------------------------------------------
 */

// ---------------------------------------------------------------------
// Level definitions (GDD section 4 — Game Structure)
// ---------------------------------------------------------------------
export const LEVELS = [
  {
    id: 1,
    name: "Warm Up",
    shortLabel: "Level 1",
    grid: { rows: 4, cols: 4 },
    pairs: 8,
    timerSeconds: 45,
  },
  {
    id: 2,
    name: "Campus Clash",
    shortLabel: "Level 2",
    grid: { rows: 5, cols: 4 },
    pairs: 10,
    timerSeconds: 35,
  },
];

// Total continuous session time across both levels (GDD section 5) → 80s.
// Power-Up pairs can extend this at runtime; this constant is the base.
export const TOTAL_GAME_SECONDS = LEVELS.reduce((sum, l) => sum + l.timerSeconds, 0);

// ---------------------------------------------------------------------
// Scoring (GDD section 6 — Scoring)
// -----------------------------------------------------------------------
// These are the tunable knobs for the scoring formula. Adjust to match
// whatever the backend actually computes — this object exists so the
// frontend (e.g. a live "combo x2!" indicator, or a score preview) has
// one place to read the same numbers the backend uses, instead of
// re-guessing them.
// -----------------------------------------------------------------------
export const SCORING = {
  pointsPerMatch: 50, // base points awarded per correctly matched pair
  comboStep: 0.1, // multiplier gained per consecutive match without a miss
  comboMaxMultiplier: 2.0, // cap on the combo multiplier
  timeBonusPerSecond: 5, // points converted from each unused second at level end
  powerUpBonusSeconds: 10, // extra countdown seconds granted per Power-Up pair
};

// Achievement copy shown on the Story Card, keyed by the highest level cleared.
export const ACHIEVEMENT_LABELS = {
  1: "Memory Rookie",
  2: "Memory Master",
};

// ---------------------------------------------------------------------
// Derived helpers — use these instead of re-deriving totals inline.
// ---------------------------------------------------------------------

/** Full config for a given level id. Falls back to Level 1 if unknown. */
export function getLevel(levelId) {
  return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
}

/** Sum of pairs across every level up to and including `levelId`. */
export function totalPairsThroughLevel(levelId) {
  return LEVELS.filter((l) => l.id <= levelId).reduce((sum, l) => sum + l.pairs, 0);
}

/** Sum of timer seconds across every level up to and including `levelId`. */
export function totalTimeThroughLevel(levelId) {
  return LEVELS.filter((l) => l.id <= levelId).reduce((sum, l) => sum + l.timerSeconds, 0);
}

/** "Level 1" or "Levels 1–2" — the human-readable phrase for UI copy. */
export function levelWordForLevel(levelId) {
  return levelId > 1 ? `Levels 1–${levelId}` : "Level 1";
}

/** Formats a raw seconds count as m:ss for display. */
export function formatClock(totalSeconds = 0) {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** True once matched_pairs reaches the total available through that level. */
export function isPerfectClear(matchedPairs, levelId) {
  const total = totalPairsThroughLevel(levelId);
  return total > 0 && matchedPairs >= total;
}