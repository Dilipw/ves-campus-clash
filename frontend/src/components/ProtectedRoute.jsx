import { Navigate } from "react-router-dom";
import { useGameSession } from "../context/GameSessionContext";

// Server status labels come straight from GameSession::getStatusLabelAttribute()
const STATUS = {
  REGISTERED: "Registered",
  PLAYING: "Playing",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  ABANDONED: "Abandoned",
};

export default function ProtectedRoute({ allow, children }) {
  const { loading, status, data } = useGameSession();

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!status) return <Navigate to="/register" replace />;

  if (!allow.includes(status)) {
    // Redirect to wherever they actually belong instead of a dead page
    if (status === STATUS.COMPLETED) return <Navigate to="/result" replace />;
    if (status === STATUS.PLAYING || status === STATUS.REGISTERED)
      return <Navigate to="/game" replace />;
    // Expired / Abandoned — nothing to resume, back to registration
    return <Navigate to="/register" replace />;
  }

  return typeof children === "function" ? children(data) : children;
}

export { STATUS };