import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameApi, API_BASE_URL } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import { useGameSession } from "../context/GameSessionContext";
import { sfx, startAmbient, stopAmbient, primeAudio } from "../services/soundEngine";
import "./game.css";

const ICONS = ["⚡", "🔥", "⭐", "🎯", "💎", "🚀", "❤️", "🌟", "🎓", "🏆"];

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

function countMatched(board) {
    return board.filter((c) => c.matched).length / 2;
}

function sumPairs(LEVELS, uptoIdxExclusive) {
    return LEVELS.slice(0, uptoIdxExclusive).reduce((sum, l) => sum + l.pairs, 0);
}

function totalPairsAllLevels(LEVELS) {
    return LEVELS.reduce((sum, l) => sum + l.pairs, 0);
}

function hasResumableLocalProgress(sessionUuid, LEVELS) {
    const local = loadStoredProgress(sessionUuid);
    if (!local) return false;
    const idx = Math.min(Math.max(0, local.levelIdx), LEVELS.length - 1);
    const boardOk = Array.isArray(local.board) && local.board.length === LEVELS[idx].pairs * 2;
    if (!boardOk) return false;
    const baseline = (local.matchedPairsTotal || 0) - countMatched(local.board);
    if (baseline !== sumPairs(LEVELS, idx)) return false;
    return idx > 0 || countMatched(local.board) > 0;
}

function progressStorageKey(uuid) {
    return `mm_progress_${uuid}`;
}

function loadStoredProgress(uuid) {
    if (!uuid) return null;
    try {
        const raw = localStorage.getItem(progressStorageKey(uuid));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveStoredProgress(uuid, data) {
    if (!uuid) return;
    try {
        localStorage.setItem(progressStorageKey(uuid), JSON.stringify(data));
    } catch {
        // ignore
    }
}

function clearStoredProgress(uuid) {
    if (!uuid) return;
    try {
        localStorage.removeItem(progressStorageKey(uuid));
    } catch {
        // ignore
    }
}

function resolveStartState(sessionUuid, sessionData, LEVELS, TOTAL_BUDGET) {
    const clampLevel = (idx) => Math.min(Math.max(0, idx), LEVELS.length - 1);

    const serverLevelIdx = clampLevel(
        sessionData?.status === STATUS.PLAYING ? (sessionData.current_level || 1) - 1 : 0
    );
    const serverMatchedPairs = sessionData?.matched_pairs || 0;
    const serverMoves = sessionData?.moves || 0;
    const serverScore = sessionData?.score || 0;
    const serverElapsed = TOTAL_BUDGET - (sessionData?.remaining_time ?? TOTAL_BUDGET);
    const serverRemainingBudget = sessionData?.remaining_time ?? TOTAL_BUDGET;

    const local = loadStoredProgress(sessionUuid);
    const localLevelIdx = local ? clampLevel(local.levelIdx) : -1;
    const maxPairs = totalPairsAllLevels(LEVELS);

    const localBoardValidForLevel =
        local &&
        localLevelIdx >= 0 &&
        Array.isArray(local.board) &&
        local.board.length === LEVELS[localLevelIdx].pairs * 2;

    const localBaseline = localBoardValidForLevel
        ? (local.matchedPairsTotal || 0) - countMatched(local.board)
        : null;
    const expectedBaseline = localLevelIdx >= 0 ? sumPairs(LEVELS, localLevelIdx) : null;
    const localIsConsistent = localBoardValidForLevel && localBaseline === expectedBaseline;

    const localIsAhead =
        localIsConsistent &&
        (localLevelIdx > serverLevelIdx ||
            (localLevelIdx === serverLevelIdx && local.matchedPairsTotal > serverMatchedPairs));

    if (localIsAhead) {
        return {
            levelIdx: localLevelIdx,
            board: local.board,
            matchedPairsTotal: Math.min(local.matchedPairsTotal, maxPairs),
            movesTotal: local.movesTotal,
            scoreTotal: local.scoreTotal,
            elapsedSeconds: local.elapsedSeconds,
            remainingBudget: Math.max(0, TOTAL_BUDGET - local.elapsedSeconds),
        };
    }

    clearStoredProgress(sessionUuid);

    const localBoardReusable =
        localBoardValidForLevel &&
        localLevelIdx === serverLevelIdx &&
        (serverMatchedPairs - sumPairs(LEVELS, serverLevelIdx)) === countMatched(local.board);

    return {
        levelIdx: serverLevelIdx,
        board: localBoardReusable ? local.board : buildDeck(LEVELS[serverLevelIdx]),
        matchedPairsTotal: Math.min(serverMatchedPairs, maxPairs),
        movesTotal: serverMoves,
        scoreTotal: serverScore,
        elapsedSeconds: serverElapsed,
        remainingBudget: serverRemainingBudget,
    };
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
    const MAX_PAIRS = totalPairsAllLevels(LEVELS);

    const resolvedInitRef = useRef(null);
    if (resolvedInitRef.current === null) {
        resolvedInitRef.current = resolveStartState(sessionUuid, sessionData, LEVELS, TOTAL_BUDGET);
    }
    const resolved = resolvedInitRef.current;

    const localHasProgressRef = useRef(null);
    if (localHasProgressRef.current === null) {
        localHasProgressRef.current = hasResumableLocalProgress(sessionUuid, LEVELS);
    }
    const localHasProgress = localHasProgressRef.current;

    const [levelIdx, setLevelIdx] = useState(resolved.levelIdx);
    const [board, setBoard] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [locked, setLocked] = useState(false);
    const [started, setStarted] = useState(false);
    const [error, setError] = useState(null);
    const [completeFailed, setCompleteFailed] = useState(false);

    const [awaitingStart, setAwaitingStart] = useState(
        sessionData?.status === STATUS.REGISTERED && !localHasProgress
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

    const matchedPairsRef = useRef(resolved.matchedPairsTotal);
    const movesRef = useRef(resolved.movesTotal);
    const scoreRef = useRef(resolved.scoreTotal);
    const streakRef = useRef(0);
    const elapsedRef = useRef(resolved.elapsedSeconds);
    const lastConfirmedRemainingRef = useRef(resolved.remainingBudget);
    const levelDeadlineRef = useRef(null);
    const lastSyncRef = useRef(0);
    const gameStartRef = useRef(null);
    const pendingCompleteReasonRef = useRef(null);

    const levelBaselineRef = useRef(resolved.matchedPairsTotal - countMatched(resolved.board));

    const boardRef = useRef(resolved.board);
    const levelIdxRef = useRef(resolved.levelIdx);
    useEffect(() => { boardRef.current = board; }, [board]);
    useEffect(() => { levelIdxRef.current = levelIdx; }, [levelIdx]);

    const initialPriorLevelsDuration = LEVELS
        .slice(0, resolved.levelIdx)
        .reduce((sum, l) => sum + l.duration, 0);
    const initialTimeSpentInLevel = Math.max(
        0,
        Math.min(LEVELS[resolved.levelIdx].duration, resolved.elapsedSeconds - initialPriorLevelsDuration)
    );

    const [display, setDisplay] = useState({
        timeLeftInLevel: LEVELS[resolved.levelIdx].duration - initialTimeSpentInLevel,
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

    function persistProgress(boardOverride, levelIdxOverride) {
        saveStoredProgress(sessionUuid, {
            levelIdx: levelIdxOverride ?? levelIdxRef.current,
            board: boardOverride ?? boardRef.current,
            matchedPairsTotal: matchedPairsRef.current,
            movesTotal: movesRef.current,
            scoreTotal: scoreRef.current,
            elapsedSeconds: elapsedRef.current,
        });
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
            current_level: levelIdxRef.current + 1,
            matched_pairs: Math.min(matchedPairsRef.current, MAX_PAIRS),
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
    }, [sessionUuid, currentRemainingBudget]);

    const completeGame = useCallback(async (reason) => {
        pendingCompleteReasonRef.current = reason;
        setStarted(false);
        setLocked(true);
        setCompleteFailed(false);
        stopAmbient();
        try {
            const res = await gameApi.complete(sessionUuid, {
                current_level: levelIdxRef.current + 1,
                matched_pairs: Math.min(matchedPairsRef.current, MAX_PAIRS),
                moves: movesRef.current,
                remaining_time: currentRemainingBudget(),
                time_taken: Math.round(elapsedRef.current),
            });
            clearStoredProgress(sessionUuid);
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
            setCompleteFailed(true);
        }
    }, [sessionUuid, currentRemainingBudget, navigate, refetch]);

    function handleLevelCleared(clearedLevelIdx) {
        if (clearedLevelIdx < LEVELS.length - 1) {
            const nextLevelIdx = clearedLevelIdx + 1;
            if (soundOnRef.current) sfx.levelUp();
            setBanner(`Level ${nextLevelIdx + 1}`);
            setTimeout(() => setBanner(null), 1300);
            const nextLevelBoard = buildDeck(LEVELS[nextLevelIdx]);
            setLevelIdx(nextLevelIdx);
            setBoard(nextLevelBoard);
            levelBaselineRef.current = matchedPairsRef.current;
            levelDeadlineRef.current = Date.now() + LEVELS[nextLevelIdx].duration * 1000;
            persistProgress(nextLevelBoard, nextLevelIdx);
            if (soundOnRef.current) startAmbient(nextLevelIdx);
            syncProgress({ current_level: nextLevelIdx + 1 });
        } else {
            completeGame("cleared");
        }
    }

    function enterBoard(state) {
        setLevelIdx(state.levelIdx);
        setBoard(state.board);
        matchedPairsRef.current = state.matchedPairsTotal;
        movesRef.current = state.movesTotal;
        scoreRef.current = state.scoreTotal;
        elapsedRef.current = state.elapsedSeconds;
        lastConfirmedRemainingRef.current = state.remainingBudget;
        levelBaselineRef.current = state.matchedPairsTotal - countMatched(state.board);
        levelIdxRef.current = state.levelIdx;
        boardRef.current = state.board;

        persistProgress(state.board, state.levelIdx);

        const now = Date.now();
        const priorLevelsDuration = LEVELS
            .slice(0, state.levelIdx)
            .reduce((sum, l) => sum + l.duration, 0);
        const timeSpentInLevel = Math.max(
            0,
            Math.min(LEVELS[state.levelIdx].duration, state.elapsedSeconds - priorLevelsDuration)
        );
        const remainingInLevel = LEVELS[state.levelIdx].duration - timeSpentInLevel;

        levelDeadlineRef.current = now + remainingInLevel * 1000;
        gameStartRef.current = now - state.elapsedSeconds * 1000;

        setStarted(true);
        if (soundOnRef.current) startAmbient(state.levelIdx);
        forceRender();

        if (countMatched(state.board) === LEVELS[state.levelIdx].pairs) {
            handleLevelCleared(state.levelIdx);
        }
    }

    async function handleStartGame() {
        setStarting(true);
        setError(null);
        primeAudio();
        try {
            await gameApi.start(sessionUuid);
            clearStoredProgress(sessionUuid);
            enterBoard({
                levelIdx: 0,
                board: buildDeck(LEVELS[0]),
                matchedPairsTotal: 0,
                movesTotal: 0,
                scoreTotal: 0,
                elapsedSeconds: 0,
                remainingBudget: TOTAL_BUDGET,
            });
            setAwaitingStart(false);
            refetch();
        } catch (err) {
            const alreadyStarted = err.response?.status === 409;
            if (alreadyStarted) {
                const resolvedNow = resolveStartState(sessionUuid, sessionData, LEVELS, TOTAL_BUDGET);
                enterBoard(resolvedNow);
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
        if (sessionData?.status === STATUS.PLAYING || localHasProgress) {
            primeAudio();
            enterBoard(resolved);
            setAwaitingStart(false);
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
                persistProgress();
            }
        }, 200);

        return () => clearInterval(tick);
    }, [started, syncProgress, completeGame]);

    useEffect(() => {
        const handler = () => {
            if (!started || !sessionUuid) return;
            persistProgress();
            const payload = JSON.stringify({
                game_session_uuid: sessionUuid,
                current_level: levelIdxRef.current + 1,
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
    }, [started, sessionUuid, currentRemainingBudget]);

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
                    matchedPairsRef.current = Math.min(matchedPairsRef.current + 1, MAX_PAIRS);

                    const gotPowerUp = a.isPowerUp || b.isPowerUp;
                    if (gotPowerUp) {
                        gameStartRef.current += 5000;
                        elapsedRef.current = Math.max(0, (Date.now() - gameStartRef.current) / 1000);
                        levelDeadlineRef.current += 5000;
                        lastConfirmedRemainingRef.current = Math.min(
                            TOTAL_BUDGET,
                            lastConfirmedRemainingRef.current + 5
                        );
                    }

                    if (soundOnRef.current) {
                        sfx.match();
                        if (gotPowerUp) sfx.powerUp();
                    }
                    if (gotPowerUp) spawnPopup("+5s ⚡");
                    else if (streakRef.current >= 2) spawnPopup(`${streakRef.current}x combo!`);

                    const updatedBoard = board.map((c) =>
                        c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
                    );
                    setBoard(updatedBoard);
                    persistProgress(updatedBoard, levelIdx);

                    const cumulativeTarget = levelBaselineRef.current + LEVELS[levelIdx].pairs;

                    if (matchedPairsRef.current === cumulativeTarget) {
                        handleLevelCleared(levelIdx);
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

    if (error && !completeFailed) {
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

                {completeFailed && (
                    <div className="mt-3 p-3 bg-punch/10 border border-punch rounded-card text-punch text-small font-mono flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => completeGame(pendingCompleteReasonRef.current)}
                            className="shrink-0 bg-punch hover:bg-punch-dim text-text-hi rounded-pill px-3 py-1 text-small font-display uppercase transition"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}