import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import html2canvas from "html2canvas";
import {
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Grid2x2,
  Timer,
  MousePointerClick,
} from "lucide-react";
import { gameApi } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import StoryCard, { STORY_WIDTH, STORY_HEIGHT } from "../components/StoryCard";
import { formatClock, totalPairsThroughLevel } from "../config/gameConfig";


const SHARE_CAPTION =
  "@ves.ac.in Campus Clash \u2014 I just cleared the board! Scan the campus QR and beat my score. #CampusClash #VESIT";


export default function ResultPage() {
  return (
    <ProtectedRoute allow={[STATUS.COMPLETED]}>
      {(sessionData) => (
        <ResultView sessionUuid={sessionData?.game_session?.uuid ?? getStoredSessionUuid()} />
      )}
    </ProtectedRoute>
  );
}

function getStoredSessionUuid() {
  try {
    const stored = JSON.parse(localStorage.getItem("participant") || "null");
    return stored?.game_session?.uuid ?? null;
  } catch {
    return null;
  }
}

function ResultView({ sessionUuid }) {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const [imageUrl, setImageUrl] = useState(null); // preview + download source
  const [imageBlob, setImageBlob] = useState(null); // for native share
  const [cardStatus, setCardStatus] = useState("idle"); // idle | rendering | ready | failed

  const [shareState, setShareState] = useState("idle"); // idle | sharing | done | unsupported
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState(""); // screen-reader status

  const cardRef = useRef(null); // full-size, off-screen node used for capture
  const imageUrlRef = useRef(null);

  const fetchResult = useCallback(() => {
    if (!sessionUuid) {
      setStatus("error");
      setErrorMessage("We couldn't find your session. Please play the game first.");
      return;
    }
    setStatus("loading");
    gameApi
      .result(sessionUuid)
      .then((res) => {
        setResult(res.data?.data || res.data);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Couldn't load your result. Check your connection and try again.");
      });
  }, [sessionUuid]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // Once we have result data, render the off-screen card and snapshot it once.
  const renderCard = useCallback(async () => {
    if (!cardRef.current) return;
    setCardStatus("rendering");
    try {
      const canvas = await html2canvas(cardRef.current, {
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        scale: 1, // node is already at native 1080x1920, no need to upscale
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) throw new Error("Canvas produced no image data");

      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      const url = URL.createObjectURL(blob);
      imageUrlRef.current = url;

      setImageBlob(blob);
      setImageUrl(url);
      setCardStatus("ready");
    } catch (err) {
      console.error("Story card render failed:", err);
      setCardStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (status === "ready") renderCard();
  }, [status, renderCard]);

  // Revoke the object URL on unmount only — not on every render.
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const canShareFiles = useMemo(() => {
    if (typeof navigator === "undefined" || !navigator.canShare) return false;
    try {
      return navigator.canShare({ files: [new File([], "x.png", { type: "image/png" })] });
    } catch {
      return false;
    }
  }, []);

  const handleDownload = () => {
    if (!imageUrl) return;
    const handle = result?.participant?.instagram_handle || "player";
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `campus-clash-${handle}-${result?.result?.score ?? "score"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloaded(true);
    setAnnouncement("Story card downloaded.");
  };

  const handleShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], "campus-clash-story.png", { type: "image/png" });

    if (canShareFiles) {
      setShareState("sharing");
      try {
        await navigator.share({ files: [file], title: "Campus Clash", text: SHARE_CAPTION });
        setShareState("done");
        setAnnouncement("Shared successfully.");
      } catch (err) {
        // AbortError just means the user closed the sheet — not a real error.
        if (err.name !== "AbortError") console.error("Share failed:", err);
        setShareState("idle");
      }
      return;
    }

    // No share sheet available on this browser — download is still the
    // guaranteed path, so lean on that instead of pretending to share.
    handleDownload();
    setShareState("unsupported");
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_CAPTION);
      setCopied(true);
      setAnnouncement("Caption copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — non-fatal, caption text is visible either way */
    }
  };

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (status === "loading") {
    return (
      <div
        className="min-h-[70vh] px-4"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
      >
        <span
          className="h-8 w-8 rounded-full border-2 border-punch border-t-transparent animate-spin"
          role="status"
          aria-label="Loading your result"
        />
        <p className="font-mono" style={{ fontSize: 13, color: "#B8ACA4", margin: 0 }}>
          Tallying your score…
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Error state
  // ------------------------------------------------------------------
  if (status === "error") {
    return (
      <div
        className="px-6 text-center min-h-[70vh]"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
      >
        <AlertCircle color="#FF5A1F" size={36} />
        <p className="font-display" style={{ margin: 0, fontSize: 22, color: "#F5EDE6", fontWeight: 700 }}>
          Something went wrong
        </p>
        <p style={{ maxWidth: 280, margin: 0, fontSize: 14, color: "#B8ACA4" }}>{errorMessage}</p>
        <button
          onClick={fetchResult}
          className="font-display uppercase text-small retry-btn"
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            border: "1px solid #C9932E",
            padding: "10px 24px",
            color: "#C9932E",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Ready state
  // ------------------------------------------------------------------
  const { score, matched_pairs, moves, time_taken, current_level } = result.result;
  const time = formatClock(time_taken);
  const totalPairs = totalPairsThroughLevel(current_level ?? 1);

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      {/* Screen-reader-only live region for async action feedback */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Score */}
      <div className="animate-[fadeSlideUp_0.5s_ease-out]">
        <span
          className="font-mono uppercase"
          style={{ fontSize: 13, letterSpacing: 2, color: "#FF5A1F", fontWeight: 700 }}
        >
          Final Score
        </span>
        <h1
          className="font-display"
          style={{ fontSize: 64, lineHeight: 1, margin: "8px 0", color: "#F5EDE6", fontWeight: 800 }}
        >
          {score}
        </h1>
      </div>

     
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <StatChip icon={<Grid2x2 size={14} />} label={`${matched_pairs}/${totalPairs} pairs`} />
        <StatChip icon={<MousePointerClick size={14} />} label={`${moves} moves`} />
      </div>

      {/* Story card preview */}
      <div className="mb-6 flex justify-center">
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            aspectRatio: `${STORY_WIDTH} / ${STORY_HEIGHT}`,
            borderRadius: 20,
            overflow: "hidden",
            border: "3px solid #F4A79F",
            boxShadow: "0 12px 32px rgba(43,36,32,0.18)",
            background: "#FBF6EC",
            position: "relative",
          }}
        >
          {cardStatus === "ready" && imageUrl && (
            <img
              src={imageUrl}
              alt={`Your Campus Clash story card — score ${score}`}
              style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
              className="animate-[fadeIn_0.4s_ease-out]"
            />
          )}

          {cardStatus === "rendering" && <CardSkeleton />}

          {cardStatus === "failed" && (
            <div
              className="w-full h-full px-6 text-center"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
            >
              <AlertCircle color="#FF5A1F" size={28} />
              <p style={{ margin: 0, fontSize: 14, color: "#7A6A64" }}>
                Couldn't generate your story card.
              </p>
              <button
                onClick={renderCard}
                className="text-small font-display uppercase retry-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#C9932E",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          className="font-display uppercase"
          onClick={handleDownload}
          disabled={cardStatus !== "ready"}
          style={{
            width: "100%",
            background: "#FF5A1F",
            color: "#FFFFFF",
            borderRadius: 999,
            border: "none",
            padding: "12px 0",
            cursor: cardStatus !== "ready" ? "not-allowed" : "pointer",
            opacity: cardStatus !== "ready" ? 0.5 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {downloaded ? <Check size={18} /> : <Download size={18} />}
            {downloaded ? "Downloaded" : "Download Story Card"}
          </span>
        </button>

        {canShareFiles && (
          <button
            className="font-display uppercase"
            onClick={handleShare}
            disabled={cardStatus !== "ready" || shareState === "sharing"}
            style={{
              width: "100%",
              background: "transparent",
              color: "#C9932E",
              border: "1px solid #C9932E",
              borderRadius: 999,
              padding: "12px 0",
              cursor: cardStatus !== "ready" || shareState === "sharing" ? "not-allowed" : "pointer",
              opacity: cardStatus !== "ready" || shareState === "sharing" ? 0.5 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Share2 size={18} />
              {shareState === "sharing" ? "Opening share sheet…" : "Share"}
            </span>
          </button>
        )}
      </div>

     
      <div
        className="text-left"
        style={{
          marginTop: 20,
          borderRadius: 16,
          border: "1px solid rgba(201, 147, 46, 0.35)",
          background: "rgba(201, 147, 46, 0.08)",
          padding: "12px 16px",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: 1, color: "#B8ACA4", marginBottom: 6 }}
        >
          Caption for your Story
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <p style={{ flex: 1, margin: 0, fontSize: 14, color: "#F5EDE6" }}>{SHARE_CAPTION}</p>
          <button
            onClick={handleCopyCaption}
            aria-label="Copy caption"
            className="copy-caption-btn"
            style={{
              flexShrink: 0,
              borderRadius: "50%",
              padding: 6,
              color: "#C9932E",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#B8ACA4", marginTop: 16 }}>
        Post it to your Instagram Story and tag <strong style={{ color: "#F5EDE6" }}>@ves.ac.in</strong> to be featured.
      </p>
      {/* Off-screen story card used for snapshotting */}
      <div style={{ position: "fixed", top: 0, left: "-99999px", pointerEvents: "none" }} aria-hidden="true">
        <StoryCard ref={cardRef} participant={result.participant} result={result.result} />
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        .retry-btn:hover {
          background: #C9932E !important;
          color: #FFFFFF !important;
        }
        .copy-caption-btn:hover {
          background: rgba(201, 147, 46, 0.1);
        }
      `}</style>
    </div>
  );
}

function StatChip({ icon, label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        background: "rgba(201, 147, 46, 0.15)",
        color: "#F5EDE6",
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span style={{ color: "#C9932E", display: "flex" }}>{icon}</span>
      {label}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(90deg, #F3E9DC 25%, #FBF6EC 37%, #F3E9DC 63%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}