import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { gameApi } from "../services/api";

// Server status labels come straight from GameSession::getStatusLabelAttribute()
const STATUS = {
  REGISTERED: "Registered",
  PLAYING: "Playing",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  ABANDONED: "Abandoned",
};

export default function ProtectedRoute({ allow, children }) {
  const [state, setState] = useState({ loading: true, status: null, data: null });

  const stored = JSON.parse(localStorage.getItem("participant") || "null");
  const sessionUuid = stored?.game_session?.uuid;

  useEffect(() => {
    if (!sessionUuid) {
      setState({ loading: false, status: null, data: null });
      return;
    }

    gameApi
      .getStatus(sessionUuid)
      .then((res) => {
        const data = res.data?.data || res.data;
        setState({ loading: false, status: data.status, data });
      })
      .catch(() => {
        localStorage.removeItem("participant");
        setState({ loading: false, status: null, data: null });
      });
  }, [sessionUuid]);

  if (state.loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!state.status) return <Navigate to="/register" replace />;

  if (!allow.includes(state.status)) {
    // Redirect to wherever they actually belong instead of a dead page
    if (state.status === STATUS.COMPLETED) return <Navigate to="/result" replace />;
    if (state.status === STATUS.PLAYING || state.status === STATUS.REGISTERED)
      return <Navigate to="/game" replace />;
    // Expired / Abandoned — nothing to resume, back to registration
    localStorage.removeItem("participant");
    return <Navigate to="/register" replace />;
  }

  return typeof children === "function" ? children(state.data) : children;
}

export { STATUS };