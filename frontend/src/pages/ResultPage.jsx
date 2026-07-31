import { useEffect, useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { gameApi } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";
import StoryCard, { STORY_WIDTH, STORY_HEIGHT } from "../components/StoryCard";

// Caption used everywhere we hand the image off to Instagram / native share.
// Keep the handle first so it survives Instagram's caption truncation.
const SHARE_CAPTION =
  "@ves.ac.in Campus Clash \u2014 I just cleared the board! Scan the campus QR and beat my score. #CampusClash #VESIT";

export default function ResultPage() {
  return (
    <ProtectedRoute allow={[STATUS.COMPLETED]}>
      {(sessionData) => <ResultView sessionUuid={sessionData ? getSessionUuid() : null} />}
    </ProtectedRoute>
  );
}

function getSessionUuid() {
  const stored = JSON.parse(localStorage.getItem("participant") || "null");
  return stored?.game_session?.uuid;
}

function ResultView() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // preview + download source
  const [imageBlob, setImageBlob] = useState(null); // for native share
  const [rendering, setRendering] = useState(false);
  const [shareState, setShareState] = useState("idle"); // idle | sharing | done | unsupported

  const cardRef = useRef(null); // full-size, off-screen node used for capture

  useEffect(() => {
    const uuid = getSessionUuid();
    gameApi
      .result(uuid)
      .then((res) => setResult(res.data?.data || res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load your result."));
  }, []);

  // Once we have result data, render the off-screen card and snapshot it once.
  const renderCard = useCallback(async () => {
    if (!cardRef.current) return;
    setRendering(true);
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

      setImageBlob(blob);
      setImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Story card render failed:", err);
      setError("Couldn't generate your story card. Try again.");
    } finally {
      setRendering(false);
    }
  }, []);

  useEffect(() => {
    if (result) renderCard();
    // Revoke the object URL on unmount / re-render to avoid leaking memory.
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `campus-clash-${result?.result?.score ?? "score"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async () => {
    if (!imageBlob) return;

    const file = new File([imageBlob], "campus-clash-story.png", { type: "image/png" });

    // Web Share API Level 2 (navigator.canShare with files) is what surfaces
    // Instagram (Story/Feed/DM) in the native share sheet on Android/iOS.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      setShareState("sharing");
      try {
        await navigator.share({
          files: [file],
          title: "Campus Clash",
          text: SHARE_CAPTION,
        });
        setShareState("done");
      } catch (err) {
        // AbortError just means the user closed the sheet — not a real error.
        if (err.name !== "AbortError") console.error("Share failed:", err);
        setShareState("idle");
      }
      return;
    }

    // Desktop / unsupported browsers: fall back to download + copy caption,
    // since there's no share sheet to hand the file to.
    setShareState("unsupported");
    handleDownload();
    try {
      await navigator.clipboard.writeText(SHARE_CAPTION);
    } catch {
      /* clipboard access denied — non-fatal, caption is shown below anyway */
    }
  };

  if (error) {
    return <div className="max-w-md mx-auto mt-10 text-punch font-mono text-small">{error}</div>;
  }

  if (!result) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
      </div>
    );
  }

  const canShareFiles =
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [new File([], "x.png", { type: "image/png" })] });

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <span className="font-mono text-small uppercase text-punch font-bold">Final Score</span>
      <h1 className="font-display text-h1 my-2">{result.result.score}</h1>
      <p className="text-small text-paper-lo mb-6">
        {result.result.matched_pairs} pairs matched in {result.result.moves} moves.
      </p>

      {/* Live preview of the story card. Sized by aspect-ratio + max-width
          so it scales cleanly on any screen instead of a fixed px scale. */}
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
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Your Campus Clash story card"
              style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="w-full bg-punch text-white rounded-pill py-3 font-display uppercase disabled:opacity-50"
          onClick={handleShare}
          disabled={!imageBlob || rendering || shareState === "sharing"}
        >
          {shareState === "sharing"
            ? "Opening share sheet..."
            : canShareFiles
            ? "Share to Instagram"
            : "Share"}
        </button>

        <button
          className="w-full border border-gold text-gold rounded-pill py-3 font-display uppercase disabled:opacity-50"
          onClick={handleDownload}
          disabled={!imageUrl || rendering}
        >
          Download Story Card
        </button>
      </div>

      {shareState === "unsupported" && (
        <p className="text-[12px] text-paper-lo mt-4">
          Your browser can't open the Instagram share sheet directly, so we downloaded the image
          and copied the caption for you. Open Instagram, add a new Story, and paste the caption:
          <br />
          <strong>{SHARE_CAPTION}</strong>
        </p>
      )}

      <p className="text-[12px] text-paper-lo mt-4">
        Post it to your Instagram Story and tag <strong>@ves.ac.in</strong> to be featured.
      </p>

      {/* Off-screen full-resolution render target for html2canvas.
          Kept in the DOM (not display:none) since html2canvas needs
          real layout to capture; pushed off-screen instead. */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "-99999px",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <StoryCard ref={cardRef} participant={result.participant} result={result.result} />
      </div>
    </div>
  );
}