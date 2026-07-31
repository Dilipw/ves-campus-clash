// Lightweight synth-based sound engine — no audio assets required.
// Everything is generated with the Web Audio API so there's nothing to
// host/bundle and nothing that can 404. Drop this file in your project
// (e.g. src/services/soundEngine.js) and import { sfx, startAmbient,
// stopAmbient, primeAudio } into GamePage.

let ctx = null;

function getCtx() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

// Browsers block audio until a user gesture — call this inside your
// "Start Game" click handler so everything after it can play freely.
export function primeAudio() {
    try {
        const audio = getCtx();
        if (audio && audio.state === "suspended") audio.resume();
    } catch {
        // Web Audio not available — sound effects will silently no-op.
    }
}

function tone({ freq, duration = 0.15, type = "sine", peakGain = 0.16, delay = 0 }) {
    const audio = getCtx();
    if (!audio) return;
    const t0 = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
}

export const sfx = {
    // Card turned face-up
    flip: () => tone({ freq: 520, duration: 0.09, type: "triangle", peakGain: 0.12 }),

    // Two icons matched
    match: () => {
        tone({ freq: 660, duration: 0.14, type: "sine", peakGain: 0.17 });
        tone({ freq: 880, duration: 0.2, type: "sine", peakGain: 0.15, delay: 0.08 });
    },

    // Two icons didn't match
    mismatch: () => tone({ freq: 170, duration: 0.22, type: "sawtooth", peakGain: 0.1 }),

    // Power-up card revealed as part of a match (+5s bonus)
    powerUp: () => {
        [880, 1046, 1318].forEach((f, i) =>
            tone({ freq: f, duration: 0.12, type: "square", peakGain: 0.1, delay: i * 0.06 })
        );
    },

    // Cleared a level, moving to the next
    levelUp: () => {
        [523, 659, 784, 1046].forEach((f, i) =>
            tone({ freq: f, duration: 0.22, type: "sine", peakGain: 0.16, delay: i * 0.09 })
        );
    },

    // Ran out of time
    timeout: () => {
        [300, 220].forEach((f, i) =>
            tone({ freq: f, duration: 0.35, type: "sine", peakGain: 0.13, delay: i * 0.18 })
        );
    },

    // Game finished — tier is "gold" | "silver" | "bronze"
    complete: (tier = "bronze") => {
        const runs = {
            gold: [784, 988, 1174, 1568],
            silver: [659, 784, 988],
            bronze: [523, 659, 784],
        };
        (runs[tier] || runs.bronze).forEach((f, i) =>
            tone({ freq: f, duration: 0.32, type: "triangle", peakGain: 0.17, delay: i * 0.13 })
        );
    },
};

// Soft ambient pad that loops in the background during play. Each level
// gets its own tiny scale so the mood shifts as things get harder.
let ambientTimer = null;

export function startAmbient(levelIndex = 0) {
    stopAmbient();
    const audio = getCtx();
    if (!audio) return;
    const scales = [
        [220, 277, 330], // level 1 — calmer
        [246.94, 311.13, 369.99], // level 2 — a touch brighter/tenser
    ];
    const scale = scales[levelIndex] || scales[scales.length - 1];
    let i = 0;
    ambientTimer = setInterval(() => {
        tone({ freq: scale[i % scale.length], duration: 1.2, type: "sine", peakGain: 0.035 });
        i++;
    }, 1400);
}

export function stopAmbient() {
    if (ambientTimer) clearInterval(ambientTimer);
    ambientTimer = null;
}