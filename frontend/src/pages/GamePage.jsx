import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameApi, API_BASE_URL } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import { useGameSession } from "../context/GameSessionContext";
import { sfx, startAmbient, stopAmbient, primeAudio } from "../services/soundEngine";
import "./game.css";

const ICONS = ["⚡", "🔥", "⭐", "🎯", "💎", "🚀", "❤️", "🌟", "🎓", "🏆"];

// Anti-cheat checkpoint interval: server compares periodic snapshots
// against the final `complete` payload.
const SYNC_INTERVAL_MS = 5000;

const SCORE_TIERS = { gold: 1500, silver: 800 };
function getTier(score) {
    if (score >= SCORE_TIERS.gold) return "gold";
    if (score >= SCORE_TIERS.silver) return "silver";
    return "bronze";
}
const TIER_COPY = {
    gold: { title: "Legendary Run!", sub: "Top-tier reflexes. That was clean." },
    silver: { title: "Great Clear!", sub: "Solid run — you were in the zone." },
    bronze: { title: "Nice Clear!", sub: "You made it through. Run it back?" },
};

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildDeck(levelConfig) {
    const icons = ICONS.slice(0, levelConfig.pairs);
    const deck = shuffle([...icons, ...icons]);
    const powerUpIdx = Math.floor(Math.random() * deck.length);
    return deck.map((icon, id) => ({ id, icon, matched: false, isPowerUp: id === powerUpIdx }));
}

function boardStorageKey(uuid) {
    return `mm_board_${uuid}`;
}

function loadStoredBoard(uuid) {
    if (!uuid) return null;
    try {
        const raw = localStorage.getItem(boardStorageKey(uuid));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveStoredBoard(uuid, levelIdx, board) {
    if (!uuid) return;
    try {
        localStorage.setItem(boardStorageKey(uuid), JSON.stringify({ levelIdx, board }));
    } catch {
        // storage full/unavailable — worst case the board just won't survive a refresh
    }
}

function clearStoredBoard(uuid) {
    if (!uuid) return;
    try {
        localStorage.removeItem(boardStorageKey(uuid));
    } catch {
        // ignore
    }
}

function countMatched(board) {
    return board.filter((c) => c.matched).length;
}

function makeConfetti(count = 26) {
    const colors = ["#f4c661", "#e0a940", "#ff8a5c", "#7dd3c0", "#f6efe0"];
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.1,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
    }));
}

// Level structure comes from GET /game/config (config('game.levels') on
// the backend), so frontend/backend timing and scoring stay in sync.
export default function GamePage() {
    const [gameConfig, setGameConfig] = useState(null);
    const [configError, setConfigError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        gameApi.getConfig()
            .then((res) => {
                if (cancelled) return;
                const data = res.data?.data || res.data;
                if (!data?.levels?.length) {
                    setConfigError("Game configuration is empty. Please try again later.");
                    return;
                }
                setGameConfig(data);
            })
            .catch((err) => {
                if (cancelled) return;
                setConfigError(err.response?.data?.message || "Could not load game configuration.");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (configError) {
        return (
            <div className="max-w-md mx-auto mt-10 p-4 bg-punch/10 border border-punch rounded-card text-punch text-small font-mono">
                {configError}
            </div>
        );
    }

    if (!gameConfig) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <ProtectedRoute allow={[STATUS.REGISTERED, STATUS.PLAYING]}>
            {(sessionData) => <GameBoard sessionData={sessionData} gameConfig={gameConfig} />}
        </ProtectedRoute>
    );
}

function GameBoard({ sessionData, gameConfig }) {
    const navigate = useNavigate();
    const { refetch } = useGameSession();
    const participant = JSON.parse(localStorage.getItem("participant") || "{}");
    const sessionUuid = participant?.game_session?.uuid;

    const LEVELS = gameConfig.levels;
    const TOTAL_BUDGET = gameConfig.total_budget_seconds ??
        LEVELS.reduce((sum, l) => sum + l.duration, 0);

    const startingLevel = sessionData?.status === STATUS.PLAYING
        ? Math.max(1, sessionData.current_level)
        : 1;

    const [levelIdx, setLevelIdx] = useState(startingLevel - 1);
    const [board, setBoard] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [locked, setLocked] = useState(false);
    const [started, setStarted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const [awaitingStart, setAwaitingStart] = useState(
        sessionData?.status === STATUS.REGISTERED
    );
    const [starting, setStarting] = useState(false);

    const [soundOn, setSoundOn] = useState(true);
    const soundOnRef = useRef(true);
    const [shakeIds, setShakeIds] = useState([]);
    const [popups, setPopups] = useState([]);
    const [banner, setBanner] = useState(null);
    const [celebration, setCelebration] = useState(null);
    const popupIdRef = useRef(0);
    const confetti = useMemo(() => makeConfetti(), [celebration?.key]);

    function toggleSound() {
        setSoundOn((prev) => {
            const next = !prev;
            soundOnRef.current = next;
            if (next && started) startAmbient(levelIdx);
            else stopAmbient();
            return next;
        });
    }

    const matchedPairsRef = useRef(sessionData?.matched_pairs || 0);
    const movesRef = useRef(sessionData?.moves || 0);
    const scoreRef = useRef(sessionData?.score || 0);
    const streakRef = useRef(0);
    const elapsedRef = useRef(TOTAL_BUDGET - (sessionData?.remaining_time ?? TOTAL_BUDGET));
    const lastConfirmedRemainingRef = useRef(sessionData?.remaining_time ?? TOTAL_BUDGET);
    const levelDeadlineRef = useRef(null);
    const lastSyncRef = useRef(0);
    const gameStartRef = useRef(null);

    // Pairs already "banked" (e.g. from a restored session) before the
    // current board's own deck was built. The current board always starts
    // fully unmatched, so completion must be judged against this baseline
    // plus the current level's pair count — not against a running total
    // that assumes the visible board already reflects prior progress.
    const levelBaselineRef = useRef(matchedPairsRef.current);

    const initialPriorLevelsDuration = LEVELS
        .slice(0, levelIdx)
        .reduce((sum, l) => sum + l.duration, 0);
    const initialTimeSpentInLevel = Math.max(
        0,
        Math.min(LEVELS[levelIdx].duration, elapsedRef.current - initialPriorLevelsDuration)
    );

    const [display, setDisplay] = useState({
        matchedPairs: matchedPairsRef.current,
        moves: movesRef.current,
        score: scoreRef.current,
        timeLeftInLevel: LEVELS[levelIdx].duration - initialTimeSpentInLevel,
    });

    const forceRender = () => setDisplay((d) => ({ ...d }));

    function spawnPopup(text) {
        const id = ++popupIdRef.current;
        const left = 20 + Math.random() * 60;
        setPopups((p) => [...p, { id, text, left }]);
        setTimeout(() => {
            setPopups((p) => p.filter((x) => x.id !== id));
        }, 900);
    }

    const currentRemainingBudget = useCallback(() => {
        const raw = TOTAL_BUDGET - elapsedRef.current;
        const clamped = Math.min(raw, lastConfirmedRemainingRef.current);
        return Math.max(0, Math.round(clamped));
    }, [TOTAL_BUDGET]);

    const syncProgress = useCallback(async (overrides = {}) => {
        if (!sessionUuid) return;
        const safeTimeTaken = Number.isFinite(elapsedRef.current)
            ? Math.max(0, Math.round(elapsedRef.current))
            : 0;

        const payload = {
            current_level: levelIdx + 1,
            matched_pairs: matchedPairsRef.current,
            moves: movesRef.current,
            remaining_time: currentRemainingBudget(),
            time_taken: safeTimeTaken,
            score: scoreRef.current,
            ...overrides,
        };
        try {
            const res = await gameApi.progress(sessionUuid, payload);
            const updated = res.data?.data || res.data;
            lastConfirmedRemainingRef.current = updated.remaining_time;
            lastSyncRef.current = Date.now();
        } catch (err) {
            console.warn("progress sync failed", err.response?.data || err);
        }
    }, [sessionUuid, levelIdx, currentRemainingBudget]);

    const completeGame = useCallback(async (reason) => {
        setStarted(false);
        setLocked(true);
        stopAmbient();
        try {
            const res = await gameApi.complete(sessionUuid, {
                current_level: levelIdx + 1,
                matched_pairs: matchedPairsRef.current,
                moves: movesRef.current,
                remaining_time: currentRemainingBudget(),
                time_taken: Math.round(elapsedRef.current),
            });
            clearStoredBoard(sessionUuid);
            const result = res.data?.data?.result || res.data?.result;
            if (result?.score != null) {
                scoreRef.current = result.score;
                forceRender();
            }

            await refetch();

            const tier = getTier(scoreRef.current || 0);
            const copy = reason === "timeout"
                ? { title: "Time's Up", sub: "The clock beat you to it this time." }
                : TIER_COPY[tier];

            if (soundOnRef.current) {
                reason === "timeout" ? sfx.timeout() : sfx.complete(tier);
            }
            setCelebration({ key: Date.now(), reason, tier, ...copy });

            setTimeout(() => {
                navigate("/result", { replace: true, state: { justCompleted: true, reason } });
            }, reason === "timeout" ? 1200 : 1700);
        } catch (err) {
            setError(err.response?.data?.message || "Could not save your result. Please check your connection.");
        }
    }, [sessionUuid, levelIdx, currentRemainingBudget, navigate, refetch]);

    function enterBoard() {
        const expectedSize = LEVELS[levelIdx].pairs * 2;
        const stored = loadStoredBoard(sessionUuid);
        const previousLevelsTotal = LEVELS
            .slice(0, levelIdx)
            .reduce((sum, l) => sum + l.pairs, 0);

        const hasValidStoredBoard =
            stored &&
            stored.levelIdx === levelIdx &&
            Array.isArray(stored.board) &&
            stored.board.length === expectedSize;

        const nextBoard = hasValidStoredBoard ? stored.board : buildDeck(LEVELS[levelIdx]);
        const matchedOnBoard = countMatched(nextBoard);

        if (hasValidStoredBoard) {
            // The board saved in this browser is the freshest record of what's
            // actually been matched this level — trust it over the backend's
            // total, which may not have finished syncing yet (a refresh can
            // land before the beforeunload beacon is processed server-side).
            matchedPairsRef.current = previousLevelsTotal + matchedOnBoard;
            levelBaselineRef.current = previousLevelsTotal;
        } else {
            // No local record for this level (new browser/device, or storage
            // was cleared) — fall back to the backend's count for the pair
            // total; we just can't show which specific cards were matched.
            levelBaselineRef.current = Math.max(0, matchedPairsRef.current - matchedOnBoard);
        }

        saveStoredBoard(sessionUuid, levelIdx, nextBoard);
        setBoard(nextBoard);

        const now = Date.now();

        // On a fresh start elapsedRef is 0, so this just gives the level its
        // full duration. On a restore, elapsedRef already reflects time spent
        // in earlier levels + this level, so we subtract that out to resume
        // the level countdown where it actually left off instead of resetting it.
        const priorLevelsDuration = LEVELS
            .slice(0, levelIdx)
            .reduce((sum, l) => sum + l.duration, 0);
        const timeSpentInLevel = Math.max(
            0,
            Math.min(LEVELS[levelIdx].duration, elapsedRef.current - priorLevelsDuration)
        );
        const remainingInLevel = LEVELS[levelIdx].duration - timeSpentInLevel;

        levelDeadlineRef.current = now + remainingInLevel * 1000;

        if (gameStartRef.current === null) {
            gameStartRef.current = now - elapsedRef.current * 1000;
        }
        setStarted(true);
        if (soundOnRef.current) startAmbient(levelIdx);
    }

    async function handleStartGame() {
        setStarting(true);
        setError(null);
        primeAudio();
        try {
            await gameApi.start(sessionUuid);
            clearStoredBoard(sessionUuid);
            lastConfirmedRemainingRef.current = TOTAL_BUDGET;
            elapsedRef.current = 0;
            gameStartRef.current = null;
            enterBoard();
            setAwaitingStart(false);
            refetch();
        } catch (err) {
            const alreadyStarted = err.response?.status === 409;
            if (alreadyStarted) {
                enterBoard();
                setAwaitingStart(false);
                refetch();
                return;
            }
            setError(err.response?.data?.message || "Could not start the game.");
        } finally {
            setStarting(false);
        }
    }

    const initRef = useRef(false);
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        if (sessionData?.status === STATUS.PLAYING) {
            primeAudio();
            enterBoard();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => stopAmbient(), []);

    useEffect(() => {
        if (!started) return;

        const tick = setInterval(() => {
            if (gameStartRef.current !== null) {
                elapsedRef.current = Math.max(0, (Date.now() - gameStartRef.current) / 1000);
            }

            const msLeftInLevel = levelDeadlineRef.current - Date.now();
            const timeLeftInLevel = Math.max(0, Math.ceil(msLeftInLevel / 1000));
            setDisplay((d) => ({ ...d, timeLeftInLevel }));

            if (msLeftInLevel <= 0) {
                completeGame("timeout");
                return;
            }

            if (Date.now() - lastSyncRef.current > SYNC_INTERVAL_MS) {
                syncProgress();
            }
        }, 200);

        return () => clearInterval(tick);
    }, [started, syncProgress, completeGame]);

    useEffect(() => {
        const handler = () => {
            if (!started || !sessionUuid) return;
            const payload = JSON.stringify({
                game_session_uuid: sessionUuid,
                current_level: levelIdx + 1,
                matched_pairs: matchedPairsRef.current,
                moves: movesRef.current,
                remaining_time: currentRemainingBudget(),
                time_taken: Math.round(elapsedRef.current),
                score: scoreRef.current,
            });
            navigator.sendBeacon?.(
                `${API_BASE_URL}/game/progress`,
                new Blob([payload], { type: "application/json" })
            );
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [started, sessionUuid, levelIdx, currentRemainingBudget]);

    function onCardClick(cellId) {
        if (!started || locked) return;
        const cell = board.find((c) => c.id === cellId);
        if (!cell || cell.matched || flipped.some((f) => f.id === cellId)) return;
        if (flipped.length === 2) return;

        if (soundOnRef.current) sfx.flip();

        const nextFlipped = [...flipped, cell];
        setFlipped(nextFlipped);

        if (nextFlipped.length === 2) {
            movesRef.current += 1;
            setLocked(true);
            const [a, b] = nextFlipped;
            const isMatch = a.icon === b.icon;

            setTimeout(() => {
                if (isMatch) {
                    streakRef.current += 1;
                    matchedPairsRef.current += 1;

                    const gotPowerUp = a.isPowerUp || b.isPowerUp;
                    if (gotPowerUp) {
                        gameStartRef.current += 5000;
                        elapsedRef.current = Math.max(0, (Date.now() - gameStartRef.current) / 1000);
                        levelDeadlineRef.current += 5000;
                    }

                    if (soundOnRef.current) {
                        sfx.match();
                        if (gotPowerUp) sfx.powerUp();
                    }
                    if (gotPowerUp) spawnPopup("+5s ⚡");
                    else if (streakRef.current >= 2) spawnPopup(`${streakRef.current}x combo!`);

                    setBoard((prev) => {
                        const updated = prev.map((c) =>
                            c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
                        );
                        saveStoredBoard(sessionUuid, levelIdx, updated);
                        return updated;
                    });

                    // Completion is judged against this board's own baseline,
                    // not a cumulative total across all levels — see
                    // levelBaselineRef above.
                    const cumulativeTarget = levelBaselineRef.current + LEVELS[levelIdx].pairs;

                    if (matchedPairsRef.current === cumulativeTarget) {
                        if (levelIdx < LEVELS.length - 1) {
                            const nextLevelIdx = levelIdx + 1;
                            if (soundOnRef.current) sfx.levelUp();
                            setBanner(`Level ${nextLevelIdx + 1}`);
                            setTimeout(() => setBanner(null), 1300);
                            const nextLevelBoard = buildDeck(LEVELS[nextLevelIdx]);
                            setLevelIdx(nextLevelIdx);
                            setBoard(nextLevelBoard);
                            saveStoredBoard(sessionUuid, nextLevelIdx, nextLevelBoard);
                            levelBaselineRef.current = matchedPairsRef.current;
                            levelDeadlineRef.current = Date.now() + LEVELS[nextLevelIdx].duration * 1000;
                            if (soundOnRef.current) startAmbient(nextLevelIdx);
                            syncProgress({ current_level: nextLevelIdx + 1 });
                        } else {
                            completeGame("cleared");
                        }
                    }
                } else {
                    streakRef.current = 0;
                    if (soundOnRef.current) sfx.mismatch();
                    setShakeIds([a.id, b.id]);
                    setTimeout(() => setShakeIds([]), 380);
                }

                setFlipped([]);
                setLocked(false);
                forceRender();
            }, 500);
        }
    }

    if (busy) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-4 bg-punch/10 border border-punch rounded-card text-punch text-small font-mono">
                {error}
            </div>
        );
    }

    if (awaitingStart) {
        return (
            <div className="max-w-md mx-auto px-3 py-10 text-center">
                <div className="start-glow mx-auto mb-5" aria-hidden="true">🎴</div>
                <h2 className="font-display text-h2 uppercase mb-2">Ready?</h2>
                <p className="text-paper-lo text-small mb-6">
                    {LEVELS.length} levels. Match pairs before the timer runs out. Tap Start when you're ready — the clock begins immediately.
                </p>
                <button
                    onClick={handleStartGame}
                    disabled={starting}
                    className="w-full bg-punch hover:bg-punch-dim disabled:opacity-50 text-text-hi rounded-pill py-3 font-display text-h3 uppercase transition"
                >
                    {starting ? "Starting…" : "Start Game"}
                </button>
            </div>
        );
    }

    const config = LEVELS[levelIdx];

    const pairsMatchedThisLevel = matchedPairsRef.current - levelBaselineRef.current;
    const timePct = Math.max(0, Math.min(100, (display.timeLeftInLevel / config.duration) * 100));
    const isUrgent = display.timeLeftInLevel <= 10;

    return (
        <div className="max-w-md mx-auto px-3 py-6">
            {banner && (
                <div className="level-banner">
                    <div className="level-banner-inner">{banner}</div>
                </div>
            )}

            {celebration && (
                <div className="celebrate-overlay">
                    {celebration.reason !== "timeout" &&
                        confetti.map((p) => (
                            <span
                                key={p.id}
                                className="confetti-piece"
                                style={{
                                    left: `${p.left}%`,
                                    background: p.color,
                                    animationDelay: `${p.delay}s`,
                                    animationDuration: `${p.duration}s`,
                                    transform: `rotate(${p.rotate}deg)`,
                                }}
                            />
                        ))}
                    <div className="celebrate-card">
                        <div className="celebrate-title">{celebration.title}</div>
                        <div className="celebrate-sub">{celebration.sub}</div>
                    </div>
                </div>
            )}

            <div className="game-shell">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-small uppercase text-punch font-bold">
                        Level {levelIdx + 1}/{LEVELS.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`font-mono text-small ${isUrgent ? "text-punch" : ""}`}>
                            {display.timeLeftInLevel}s
                        </span>
                        <button
                            type="button"
                            onClick={toggleSound}
                            className="sound-toggle"
                            aria-label={soundOn ? "Mute sound" : "Unmute sound"}
                            title={soundOn ? "Mute sound" : "Unmute sound"}
                        >
                            {soundOn ? "🔊" : "🔇"}
                        </button>
                    </div>
                </div>

                <div className="timer-track">
                    <div
                        className={`timer-fill ${isUrgent ? "urgent" : ""}`}
                        style={{ width: `${timePct}%` }}
                    />
                </div>

                <div className="relative">
                    <div className="popup-layer">
                        {popups.map((p) => (
                            <span
                                key={p.id}
                                className="combo-popup"
                                style={{ left: `${p.left}%`, top: "40%" }}
                            >
                                {p.text}
                            </span>
                        ))}
                    </div>

                    <div
                        className="grid gap-2 mb-4"
                        style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
                    >
                        {board.map((cell, i) => {
                            const isFlipped = flipped.some((f) => f.id === cell.id) || cell.matched;
                            const isShaking = shakeIds.includes(cell.id);
                            return (
                                <div
                                    key={cell.id}
                                    style={{ "--i": i }}
                                    className={`card ${isFlipped ? "flipped" : ""} ${cell.matched ? "matched" : ""} ${isShaking ? "shake" : ""}`}
                                    onClick={() => onCardClick(cell.id)}
                                >
                                    <div className="card-inner">
                                        <div className={`card-face card-back ${cell.isPowerUp ? "power-up" : ""}`} />
                                        <div className="card-face card-front">{cell.icon}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center text-small font-mono text-paper-lo">
                    <span>Pairs: {pairsMatchedThisLevel}/{config.pairs}</span>
                    <div className="pairs-track">
                        <div
                            className="pairs-fill"
                            style={{ width: `${(pairsMatchedThisLevel / config.pairs) * 100}%` }}
                        />
                    </div>
                    <span>Moves: {movesRef.current}</span>
                </div>
            </div>
        </div>
    );
}