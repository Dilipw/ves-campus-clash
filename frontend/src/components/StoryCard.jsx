import { forwardRef } from "react";
import {
    Trophy,
    QrCode,
    Award
} from "lucide-react";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const c = {
    bg: "#FFFDF9",
    primary: "#FF5A1F",
    primaryDark: "#E84A17",
    primaryLight: "#FFE7DD",
    text: "#2D1B15",
    muted: "#7A6A64",
    border: "#FF6F00",
    divider: "#F2E4DB",
    white: "#FFFFFF",
    success: "#0F9D58",
};

function fallbackAvatar(name = "Player") {
    const initials =
        name.trim().split(" ").map((v) => v[0]).join("").slice(0, 2).toUpperCase() || "P";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF5A1F"/><stop offset="100%" stop-color="#FF875A"/>
        </linearGradient></defs>
        <circle cx="90" cy="90" r="90" fill="url(#g)"/>
        <circle cx="90" cy="90" r="84" fill="none" stroke="#fff" stroke-width="4"/>
        <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="68" font-weight="700" fill="#fff">${initials}</text>
    </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function QR({ size = 140 }) {
    return <QrCode size={size} color={c.primary} strokeWidth={2.5} />;
}

const StoryCard = forwardRef(function StoryCard({ participant = {}, result = {} }, ref) {
    const name = participant.full_name || "Player";
    const handle = participant.instagram_handle || "player";
    const photo = participant.profile_photo || fallbackAvatar(name);
    const score = result.score ?? 0;
    const totalSeconds = result.time_taken ?? 0;
    const time = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

    const stats = [
        { label: "Pairs", value: `${result.matched_pairs ?? 0}/12` },
        { label: "Moves", value: result.moves ?? 0 },
        { label: "Time", value: time },
        { label: "Level", value: `Lvl ${result.current_level ?? 1}`, accent: true },
    ];

    return (
        <div
            ref={ref}
            style={{
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                background: c.bg,
                border: `14px solid ${c.border}`,
                borderRadius: 48,
                boxSizing: "border-box",
                overflow: "hidden",
                position: "relative",
                fontFamily: "'Outfit', sans-serif",
                color: c.text,
                padding: "50px 65px",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: c.primary, textTransform: "uppercase", letterSpacing: 1 }}>
                    VES Campus Clash
                </div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: c.muted, letterSpacing: 5 }}>
                    SCAN • PLAY • SCORE
                </div>
            </div>

            {/* Score – tighter gap + larger fonts */}
            <div style={{ marginTop: 32, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 4 }}>
                    Final Score
                </div>

                {/* gap reduced: marginTop 2 instead of 8 */}
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 180, fontWeight: 800, lineHeight: 0.95, marginTop: 2 }}>
                    {score}
                </div>
            </div>

            {/* Player */}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 50 }}>
                <img
                    src={photo}
                    alt={name}
                    crossOrigin="anonymous"
                    width={170}
                    height={150}
                    style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `6px solid ${c.primary}`,
                        background: c.white,
                    }}
                />
                <div style={{ marginTop: 16, fontSize: 42, fontWeight: 800, textAlign: "center" }}>{name}</div>
                <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: c.muted }}>@{handle}</div>
            </div>

            <Divider />

            {/* Stats */}
            <div
                style={{
                    marginTop: 24,
                    background: c.white,
                    border: `2px solid ${c.divider}`,
                    borderRadius: 32,
                    padding: "30px 26px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 24,
                }}
            >
                {stats.map(({ label, value, accent }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: c.muted, letterSpacing: 2, textTransform: "uppercase" }}>
                            {label}
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 56,
                                fontWeight: 800,
                                color: accent ? c.primary : c.text,
                            }}
                        >
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            <Divider />

            {/* Achievement */}
            <div
                style={{
                    marginTop: 24,
                    background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                    borderRadius: 32,
                    padding: "30px 34px",
                    color: c.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                }}
            >
                <div>
                    <div style={{ fontSize: 32, fontWeight: 900, display: "flex", alignItems: "center", gap: 12 }}>
                        <Award size={34} />
                        <span>Memory Master</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 20, lineHeight: 1.5, opacity: 0.95 }}>
                        Completed the VES Campus Clash Memory Match Challenge.
                    </div>
                </div>
                <div
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Trophy size={56} color={c.white} />
                </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div
                style={{
                    borderTop: `3px solid ${c.divider}`,
                    paddingTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 28,
                }}
            >
                <div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: c.primary }}>
                        Challenge Your Friends
                    </div>

                    <div style={{ marginTop: 12, fontSize: 22, color: c.muted, lineHeight: 1.65, fontWeight: 600 }}>
                        <div>Scan the QR Code</div>
                        <div>Play Memory Match</div>
                        <div>Follow @ves.ac.in</div>
                    </div>

                    <Badge style={{ marginTop: 16 }}>#VESCampusClash</Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            background: c.white,
                            padding: 14,
                            borderRadius: 20,
                            border: `6px solid ${c.primary}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <QR size={120} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 1 }}>
                        Scan to Play
                    </div>
                </div>
            </div>

            {/* Bottom links */}
            <div
                style={{
                    marginTop: 18,
                    display: "flex",
                    justifyContent: "space-between",
                    color: c.muted,
                    fontSize: 20,
                    fontWeight: 700,
                }}
            >
                <span>www.ves.ac.in</span>
                <span>@ves.ac.in</span>
            </div>

            {/* Bottom strip */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 14,
                    background: "linear-gradient(90deg,#FF5A1F,#FF884F,#FF5A1F)",
                }}
            />
        </div>
    );
});

function Badge({ children, style }) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: c.primaryLight,
                color: c.primary,
                padding: "12px 24px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 18,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function Divider() {
    return <div style={{ marginTop: 24, height: 2, background: c.divider, borderRadius: 999 }} />;
}

export default StoryCard;