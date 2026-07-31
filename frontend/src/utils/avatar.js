// Generates a deterministic, on-brand initials avatar as an inline SVG
// data URL — used whenever participant.profile_photo is null. Same name
// always produces the same avatar, so it feels consistent across visits.

const PALETTE = [
    ["#F4C661", "#0D1B3D"], // gold -> navy
    ["#FF6B6B", "#1A0F1F"], // coral -> plum
    ["#7DD3C0", "#0D2B26"], // teal -> deep green
    ["#8E7CFF", "#150F2E"], // violet -> ink
    ["#FF9F5A", "#241017"], // amber -> maroon
    ["#5CC8FF", "#0B1A2B"], // sky -> deep navy
];

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = str.charCodeAt(i) + ((h << 5) - h);
        h |= 0;
    }
    return Math.abs(h);
}

export function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "VC";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateAvatarDataUrl(name = "", size = 240) {
    const initials = getInitials(name);
    const [accent, base] = PALETTE[hashString(name || "VES") % PALETTE.length];
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size}" fill="url(#g)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="800"
    font-size="${Math.round(size * 0.36)}" fill="#FFFFFF" letter-spacing="1">${initials}</text>
</svg>`.trim();

    // base64 (not ;utf8,) — html2canvas and several browsers don't reliably
    // rasterize `;utf8,` SVG data URLs when used as an <img src>. That's why
    // the avatar sometimes didn't show up, or looked identical for every
    // participant regardless of name — base64 fixes both.
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
}

// Convenience: resolves whichever image to actually render.
export function resolveAvatarSrc(profilePhoto, name) {
    return profilePhoto || generateAvatarDataUrl(name);
}