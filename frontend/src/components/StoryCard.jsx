import { forwardRef } from "react";
import { generateAvatarDataUrl } from "../utils/avatar";

// Hand-written inline SVG icons instead of react-icons. The react-icons
// components rendered fine on screen but came back BLANK in the
// html2canvas capture (see the "Level Cleared" pill in testing) — a known
// compatibility gap between that library's SVGs and html2canvas's
// rasterizer. Plain inline <svg> with hardcoded fill colors captures
// reliably every time.
function TrophyIcon({ size = 22, color = "#E2564F" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
                d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
                fill={color}
            />
            <path
                d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path d="M10 12.5h4v3h-4z" fill={color} />
            <path d="M8 19h8v1.6H8z" fill={color} />
            <path d="M9.5 15.5h5l1 3.5h-7l1-3.5Z" fill={color} />
        </svg>
    );
}

function InstagramIcon({ size = 20, color = "#E2564F" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke={color} strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.6" stroke={color} strokeWidth="1.8" />
            <circle cx="17.6" cy="6.4" r="1.3" fill={color} />
        </svg>
    );
}

// Simple deterministic "QR-like" placeholder — visually reads as a QR code
// (three finder squares + a data grid) without needing a QR library. Swap
// the inner render for a real <QRCode value="..."/> (e.g. react-qr-code)
// once you have the actual play-link URL to encode.
function DummyQR({ size = 176, color = "#2B2420" }) {
    const cells = 21; // classic QR module count, purely visual here
    const cell = size / cells;
    const finder = (x, y) => (
        <g key={`f-${x}-${y}`}>
            <rect x={x} y={y} width={cell * 7} height={cell * 7} fill="#FFFFFF" />
            <rect x={x} y={y} width={cell * 7} height={cell * 7} fill={color} />
            <rect x={x + cell} y={y + cell} width={cell * 5} height={cell * 5} fill="#FFFFFF" />
            <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} fill={color} />
        </g>
    );

    // Fixed pseudo-random-looking grid so it renders identically every
    // time (deterministic == capture-safe, no client/server mismatch).
    const seed = 1337;
    const rng = (i) => {
        const x = Math.sin(seed + i * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    const dataCells = [];
    let i = 0;
    for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
            const inFinderTL = row < 8 && col < 8;
            const inFinderTR = row < 8 && col > cells - 9;
            const inFinderBL = row > cells - 9 && col < 8;
            if (inFinderTL || inFinderTR || inFinderBL) continue;
            i++;
            if (rng(i) > 0.56) {
                dataCells.push(
                    <rect
                        key={`d-${row}-${col}`}
                        x={col * cell}
                        y={row * cell}
                        width={cell}
                        height={cell}
                        fill={color}
                    />
                );
            }
        }
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect width={size} height={size} fill="#FFFFFF" />
            {dataCells}
            {finder(0, 0)}
            {finder(size - cell * 7, 0)}
            {finder(0, size - cell * 7)}
        </svg>
    );
}

// Fixed at Instagram Story resolution (9:16). Rendered off-screen at full
// size for html2canvas to capture, and re-used at a scaled-down size for
// the on-page preview — see ResultPage.jsx.
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

// Cream + light-red palette. Colors are solid (no gradients/backgroundClip
// text tricks) because html2canvas doesn't reliably capture those — it
// rendered as a solid block in testing. Solid colors capture pixel-perfect.
const CREAM = "#FBF6EC";
const CREAM_DEEP = "#F3EAD8";
const INK = "#2B2420";
const INK_SOFT = "#6B5F52";
const RED = "#E2564F";
const RED_SOFT = "#F4A79F";
const RED_TINT = "#FCEBE9";

function StatPill({ label, value }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#FFFFFF",
                border: `1.5px solid ${RED_SOFT}`,
                borderRadius: 20,
                padding: "24px 8px",
                flex: 1,
            }}
        >
            <span style={{ fontSize: 44, fontWeight: 800, color: INK, lineHeight: 1 }}>
                {value}
            </span>
            <span
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: RED,
                    textTransform: "uppercase",
                    marginTop: 10,
                }}
            >
                {label}
            </span>
        </div>
    );
}

const StoryCard = forwardRef(function StoryCard({ participant, result }, ref) {
    const avatarSrc = participant?.profile_photo || generateAvatarDataUrl(participant?.full_name);
    const minutes = Math.floor((result?.time_taken || 0) / 60);
    const seconds = String((result?.time_taken || 0) % 60).padStart(2, "0");

    return (
        <div
            ref={ref}
            style={{
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                position: "relative",
                overflow: "hidden",
                background: CREAM,
                border: `10px solid ${RED_SOFT}`,
                boxSizing: "border-box",
                fontFamily: "Arial, Helvetica, sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px 64px 56px",
            }}
        >
            {/* Soft corner tints — solid, capture-safe */}
            <div
                style={{
                    position: "absolute",
                    top: -140,
                    left: -140,
                    width: 380,
                    height: 380,
                    borderRadius: "50%",
                    background: RED_TINT,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: -160,
                    right: -160,
                    width: 420,
                    height: 420,
                    borderRadius: "50%",
                    background: CREAM_DEEP,
                }}
            />

            {/* Wordmark */}
            <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: 6,
                        color: RED,
                        marginBottom: 8,
                    }}
                >
                    VESIT PRESENTS
                </div>
                <div
                    style={{
                        fontSize: 58,
                        fontWeight: 900,
                        letterSpacing: 1,
                        color: INK,
                        textTransform: "uppercase",
                        lineHeight: 1.05,
                    }}
                >
                    Campus Clash
                </div>
            </div>

            {/* Score block */}
            <div style={{ marginTop: 64, textAlign: "center", position: "relative", zIndex: 1 }}>
                <div
                    style={{
                        fontSize: 24,
                        fontWeight: 700,
                        letterSpacing: 5,
                        color: INK_SOFT,
                        marginBottom: 6,
                    }}
                >
                    FINAL SCORE
                </div>
                <div
                    style={{
                        fontSize: 176,
                        fontWeight: 900,
                        lineHeight: 1,
                        color: RED,
                    }}
                >
                    {result?.score ?? 0}
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 16,
                        padding: "10px 22px",
                        borderRadius: 999,
                        background: "#FFFFFF",
                        border: `1.5px solid ${RED_SOFT}`,
                    }}
                >
                    <TrophyIcon size={22} color={RED} />
                    <span style={{ fontSize: 20, fontWeight: 700, color: INK }}>
                        Level {result?.current_level ?? 1} Cleared
                    </span>
                </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", gap: 16, width: "100%", marginTop: 56, position: "relative", zIndex: 1 }}>
                <StatPill label="Pairs" value={result?.matched_pairs ?? 0} />
                <StatPill label="Moves" value={result?.moves ?? 0} />
                <StatPill label="Time" value={`${minutes}:${seconds}`} />
            </div>

            {/* Participant identity */}
            <div
                style={{
                    marginTop: 56,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    background: "#FFFFFF",
                    border: `1.5px solid ${RED_SOFT}`,
                    borderRadius: 24,
                    padding: "20px 28px",
                    width: "100%",
                    boxSizing: "border-box",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <img
                    src={avatarSrc}
                    alt=""
                    width={84}
                    height={84}
                    style={{ borderRadius: "50%", border: `2px solid ${RED}`, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 30,
                            fontWeight: 800,
                            color: INK,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {participant?.full_name || "Player"}
                    </div>
                    {participant?.instagram_handle && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <InstagramIcon size={20} color={RED} />
                            <span style={{ fontSize: 22, color: INK_SOFT }}>
                                @{participant.instagram_handle}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Spacer distributes remaining space instead of shoving
                everything below to the absolute bottom edge. */}
            <div style={{ flex: 1, minHeight: 24 }} />

            {/* QR block — placeholder pattern until wired to a real
                play-link URL (see DummyQR's comment above for the swap). */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        padding: 14,
                        background: "#FFFFFF",
                        borderRadius: 20,
                        border: `1.5px solid ${RED_SOFT}`,
                    }}
                >
                    <DummyQR size={168} color={INK} />
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 24 }} />

            {/* CTA footer */}
            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: INK_SOFT,
                        marginBottom: 12,
                    }}
                >
                    Scan the campus QR to play
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 30,
                        fontWeight: 900,
                        color: RED,
                        letterSpacing: 1,
                    }}
                >
                    <InstagramIcon size={30} color={RED} /> @ves.ac.in
                </div>
            </div>
        </div>
    );
});

export default StoryCard;