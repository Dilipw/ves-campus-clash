import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameApi, API_BASE_URL } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import { useGameSession } from "../context/GameSessionContext";
import { sfx, startAmbient, stopAmbient, primeAudio } from "../services/soundEngine";
import "./game.css";

const LEVELS = [
    { level: 1, pairs: 8, cols: 4, duration: 45 },
    { level: 2, pairs: 10, cols: 5, duration: 35 },
];
const TOTAL_BUDGET = LEVELS.reduce((sum, l) => sum + l.duration, 0);
const ICONS = ["⚡", "🔥", "⭐", "🎯", "💎", "🚀", "❤️", "🌟", "🎓", "🏆"];

// Restored to a short interval on purpose: this is the server's main
// anti-cheat checkpoint. Each sync gives the backend a timestamped
// snapshot of matched_pairs/moves/remaining_time to compare against
// what's ultimately submitted at `complete` — the more checkpoints,
// the smaller the window for a single fabricated jump to go unnoticed.
// Combined with level-transition syncs and the beforeunload beacon.
const SYNC_INTERVAL_MS = 5000;

// Tune these to whatever your backend's actual score scale is — they
// only drive which celebration copy/sound plays, nothing gameplay-related.
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

export default function GamePage() {
    return (
        <ProtectedRoute allow={[STATUS.REGISTERED, STATUS.PLAYING]}>
            {(sessionData) => <GameBoard sessionData={sessionData} />}
        </ProtectedRoute>
    );
}

function GameBoard({ sessionData }) {
    const navigate = useNavigate();
    const { refetch } = useGameSession();
    const participant = JSON.parse(localStorage.getItem("participant") || "{}");
    const sessionUuid = participant?.game_session?.uuid;

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

    const [display, setDisplay] = useState({
        matchedPairs: matchedPairsRef.current,
        moves: movesRef.current,
        score: scoreRef.current,
        timeLeftInLevel: LEVELS[levelIdx].duration,
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
        stopAmbient();
        try {
            const res = await gameApi.complete(sessionUuid, {
                current_level: levelIdx + 1,
                matched_pairs: matchedPairsRef.current,
                moves: movesRef.current,
                remaining_time: currentRemainingBudget(),
                time_taken: Math.round(elapsedRef.current),
            });
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
        setBoard(buildDeck(LEVELS[levelIdx]));
        const now = Date.now();
        levelDeadlineRef.current = now + LEVELS[levelIdx].duration * 1000;
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

                    setBoard((prev) =>
                        prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c))
                    );

                    const cumulativeTarget = LEVELS
                        .slice(0, levelIdx + 1)
                        .reduce((sum, l) => sum + l.pairs, 0);

                    if (matchedPairsRef.current === cumulativeTarget) {
                        if (levelIdx < LEVELS.length - 1) {
                            const nextLevelIdx = levelIdx + 1;
                            if (soundOnRef.current) sfx.levelUp();
                            setBanner(`Level ${nextLevelIdx + 1}`);
                            setTimeout(() => setBanner(null), 1300);
                            setLevelIdx(nextLevelIdx);
                            setBoard(buildDeck(LEVELS[nextLevelIdx]));
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
                    2 levels. Match pairs before the timer runs out. Tap Start when you're ready — the clock begins immediately.
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

    const previousLevelsTotal = LEVELS
        .slice(0, levelIdx)
        .reduce((sum, l) => sum + l.pairs, 0);
    const pairsMatchedThisLevel = matchedPairsRef.current - previousLevelsTotal;
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