import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { gameApi } from "../services/api";

const GameSessionContext = createContext(null);

function getStoredParticipant() {
  try {
    return JSON.parse(localStorage.getItem("participant") || "null");
  } catch {
    return null;
  }
}

export function GameSessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, status: null, data: null, error: null });

  const refetch = useCallback(() => {
    const stored = getStoredParticipant();
    const sessionUuid = stored?.game_session?.uuid;

    if (!sessionUuid) {
      setState({ loading: false, status: null, data: null, error: null });
      return Promise.resolve();
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    return gameApi
      .getStatus(sessionUuid)
      .then((res) => {
        const data = res.data?.data || res.data;

        const current = getStoredParticipant();
        if (current) {
          current.game_session = { ...current.game_session, status: data.status };
          localStorage.setItem("participant", JSON.stringify(current));
        }

        setState({ loading: false, status: data.status, data, error: null });
      })
      .catch((err) => {
        const httpStatus = err.response?.status;
        const sessionGone = httpStatus === 404 || httpStatus === 410;

        if (sessionGone) {

          localStorage.removeItem("participant");
          setState({ loading: false, status: null, data: null, error: null });
          return;
        }

        setState((s) => ({
          ...s,
          loading: false,
          error: err.isTimeout
            ? "Connection timed out. Please check your network and try again."
            : "Could not reach the server. Please check your connection and try again.",
        }));
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <GameSessionContext.Provider value={{ ...state, refetch }}>
      {children}
    </GameSessionContext.Provider>
  );
}

export const useGameSession = () => {
  const ctx = useContext(GameSessionContext);
  if (!ctx) throw new Error("useGameSession must be used inside GameSessionProvider");
  return ctx;
};