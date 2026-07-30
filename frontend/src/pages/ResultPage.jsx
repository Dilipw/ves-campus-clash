import { useEffect, useState } from "react";
import { gameApi } from "../services/api";
import ProtectedRoute, { STATUS } from "../components/ProtectedRoute";

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

  useEffect(() => {
    const uuid = getSessionUuid();
    gameApi
      .result(uuid)
      .then((res) => setResult(res.data?.data || res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load your result."));
  }, []);

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

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <span className="font-mono text-small uppercase text-punch font-bold">Final Score</span>
      <h1 className="font-display text-h1 my-2">{result.result.score}</h1>
      <p className="text-small text-paper-lo mb-6">
        {result.result.matched_pairs} pairs matched in {result.result.moves} moves.
      </p>

      <button
        className="w-full bg-punch text-white rounded-pill py-3 font-display uppercase"
        onClick={() => downloadStoryCard(result)}
      >
        Download Story Card
      </button>

      <p className="text-[12px] text-paper-lo mt-4">
        Post it to your Instagram Story and tag <strong>@ves.ac.in</strong> to be featured.
      </p>
    </div>
  );
}

function downloadStoryCard(result) {
  // Wire this to your Story Card generation endpoint/canvas renderer.
}