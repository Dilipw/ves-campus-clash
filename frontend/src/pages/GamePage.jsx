import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameApi, API_BASE_URL } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import "./game.css";

// Mirrors the GDD (Section 7/8): 2 levels, increasing difficulty.
// Duration is per-level for display only — what we report to the
// server is a single monotonic "remaining_time" budget (see notes).
const LEVELS = [
    { level: 1, pairs: 8, cols: 4, duration: 45 },
    { level: 2, pairs: 10, cols: 5, duration: 35 },
];
const TOTAL_BUDGET = LEVELS.reduce((sum, l) => sum + l.duration, 0);
const ICONS = ["⚡", "🔥", "⭐", "🎯", "💎", "🚀", "❤️", "🌟", "🎓", "🏆"];
const SYNC_INTERVAL_MS = 5000;

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

export default function GamePage() {
    return (
        <ProtectedRoute allow={[STATUS.REGISTERED, STATUS.PLAYING]}>
            {(sessionData) => <GameBoard sessionData={sessionData} />}
        </ProtectedRoute>
    );
}

function GameBoard({ sessionData }) {
    const navigate = useNavigate();
    const participant = JSON.parse(localStorage.getItem("participant") || "{}");
    const sessionUuid = participant?.game_session?.uuid;

    // Resume point: if we're already Playing (e.g. page refresh mid-game),
    // start the player on their last known level with a fresh board rather
    // than trying to reconstruct exact card positions — fair and simple.
    const startingLevel = sessionData?.status === STATUS.PLAYING
        ? Math.max(1, sessionData.current_level)
        : 1;

    const [levelIdx, setLevelIdx] = useState(startingLevel - 1);
    const [board, setBoard] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [locked, setLocked] = useState(false);
    const [started, setStarted] = useState(false);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState(null);

    // Fast-changing counters live in refs so the ticking interval and
    // click handlers always read the latest value without stale closures.
    const matchedPairsRef = useRef(sessionData?.matched_pairs || 0);
    const movesRef = useRef(sessionData?.moves || 0);
    const scoreRef = useRef(sessionData?.score || 0); // display only — server owns the real score
    const streakRef = useRef(0);
    const elapsedRef = useRef(TOTAL_BUDGET - (sessionData?.remaining_time ?? TOTAL_BUDGET));
    const lastConfirmedRemainingRef = useRef(sessionData?.remaining_time ?? TOTAL_BUDGET);
    const levelDeadlineRef = useRef(null);
    const lastSyncRef = useRef(0);

    // Guards against React Strict Mode's dev-only double-invoke of effects,
    // and against any accidental double-fire of the init logic in general.
    const initRef = useRef(false);

    const [display, setDisplay] = useState({
        matchedPairs: matchedPairsRef.current,
        moves: movesRef.current,
        score: scoreRef.current,
        timeLeftInLevel: LEVELS[levelIdx].duration,
    });

    const forceRender = () => setDisplay((d) => ({ ...d }));

    // ---- server sync -------------------------------------------------

    const currentRemainingBudget = useCallback(() => {
        const raw = TOTAL_BUDGET - elapsedRef.current;
        // Never report an increase over the last value the server accepted.
        const clamped = Math.min(raw, lastConfirmedRemainingRef.current);
        return Math.max(0, Math.round(clamped));
    }, []);

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
        try {
            await gameApi.complete(sessionUuid, {
                current_level: levelIdx + 1,
                matched_pairs: matchedPairsRef.current,
                moves: movesRef.current,
                remaining_time: currentRemainingBudget(),
                time_taken: Math.round(elapsedRef.current),
            });
            navigate("/result", { replace: true, state: { justCompleted: true, reason } });
        } catch (err) {
            setError(err.response?.data?.message || "Could not save your result. Please check your connection.");
        }
    }, [sessionUuid, levelIdx, currentRemainingBudget, navigate]);

    // ---- game start / resume -----------------------------------------

    useEffect(() => {
        // Strict Mode runs effects twice in dev — this ref makes sure the
        // actual start/resume logic below only ever executes once per mount.
        if (initRef.current) return;
        initRef.current = true;

        let cancelled = false;

        function enterBoard() {
            if (cancelled) return;
            setBoard(buildDeck(LEVELS[levelIdx]));
            levelDeadlineRef.current = Date.now() + LEVELS[levelIdx].duration * 1000;
            setStarted(true);
            setBusy(false);
        }

        async function init() {
            try {
                if (sessionData?.status === STATUS.REGISTERED) {
                    await gameApi.start(sessionUuid);
                    lastConfirmedRemainingRef.current = TOTAL_BUDGET;
                    elapsedRef.current = 0;
                }
                enterBoard();
            } catch (err) {
                const alreadyStarted = err.response?.status === 409;

                if (alreadyStarted) {
                    // Session is legitimately already Playing server-side (double
                    // click, retry, second tab, etc). Not a real failure — just
                    // resume into the board instead of showing an error.
                    enterBoard();
                    return;
                }

                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not start the game.");
                    setBusy(false);
                }
            }
        }

        init();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- master timer: one tick drives elapsed time + level clock -----

    useEffect(() => {
        if (!started) return;

        const tick = setInterval(() => {
            elapsedRef.current += 0.2;

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

    // Best-effort save if the player closes the tab mid-game.
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
            });
            navigator.sendBeacon?.(
                `${API_BASE_URL}/game/progress`,
                new Blob([payload], { type: "application/json" })
            );
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [started, sessionUuid, levelIdx, currentRemainingBudget]);

    // ---- card interaction ---------------------------------------------

    function onCardClick(cellId) {
        if (!started || locked) return;
        const cell = board.find((c) => c.id === cellId);
        if (!cell || cell.matched || flipped.some((f) => f.id === cellId)) return;
        if (flipped.length === 2) return;

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

                    if (a.isPowerUp || b.isPowerUp) {
                        elapsedRef.current = Math.max(0, elapsedRef.current - 5); // +5s bonus
                        levelDeadlineRef.current += 5000;
                    }

                    setBoard((prev) =>
                        prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c))
                    );

                    const config = LEVELS[levelIdx];
                    const matchedInLevel = board.filter((c) => c.matched).length + 1;

                    if (matchedInLevel === config.pairs) {
                        if (levelIdx < LEVELS.length - 1) {
                            syncProgress({ current_level: levelIdx + 2 }).then(() => {
                                setLevelIdx((i) => i + 1);
                                setBoard(buildDeck(LEVELS[levelIdx + 1]));
                                levelDeadlineRef.current = Date.now() + LEVELS[levelIdx + 1].duration * 1000;
                            });
                        } else {
                            completeGame("cleared");
                        }
                    }
                } else {
                    streakRef.current = 0;
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

    const config = LEVELS[levelIdx];

    return (
        <div className="max-w-md mx-auto px-3 py-6">
            <div className="game-shell">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-small uppercase text-punch font-bold">
                        Level {levelIdx + 1}/{LEVELS.length}
                    </span>
                    <span className="font-mono text-small">{display.timeLeftInLevel}s</span>
                </div>

                <div
                    className="grid gap-2 mb-4"
                    style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
                >
                    {board.map((cell) => {
                        const isFlipped = flipped.some((f) => f.id === cell.id) || cell.matched;
                        return (
                            <div
                                key={cell.id}
                                className={`card ${isFlipped ? "flipped" : ""} ${cell.matched ? "matched" : ""}`}
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

                <div className="flex justify-between text-small font-mono text-paper-lo">
                    <span>Pairs: {matchedPairsRef.current}/{config.pairs}</span>
                    <span>Moves: {movesRef.current}</span>
                </div>
            </div>
        </div>
    );
}