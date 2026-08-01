import { Link } from "react-router-dom";
import { STATUS } from "../ProtectedRoute";
import { useGameSession } from "../../context/GameSessionContext";

function getNavTab(status) {
  switch (status) {
    case STATUS.REGISTERED:
    case STATUS.PLAYING:
      return { label: "Continue", to: "/game" };
    case STATUS.COMPLETED:
      return { label: "Result", to: "/result" };
    default:
      return { label: "Register", to: "/register" };
  }
}

export default function Navbar() {
  const { status } = useGameSession();
  const tab = getNavTab(status);

  return (
    <header className="sticky top-0 z-50 bg-ink/85 backdrop-blur-md border-b border-ink-line">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <path
              d="M3 9a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v3a2.5 2.5 0 0 0 0 5v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a2.5 2.5 0 0 0 0-5V9Z"
              fill="var(--volt)"
            />
            <circle cx="17" cy="17" r="2.2" fill="var(--ink)" />
          </svg>

          <div className="leading-tight">
            <p className="font-display font-bold tracking-tight text-text-hi text-[15px] sm:text-base">
              VES CAMPUS CLASH
            </p>
            <p className="font-mono text-[10px] tracking-widest text-text-lo">
              SCAN • PLAY • SCORE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-text-lo">
            <span className="w-1.5 h-1.5 rounded-full bg-punch animate-pulse-dot" />
            LIVE ON CAMPUS
          </span>

          <Link
            to={tab.to}
            className="font-mono text-[12px] sm:text-[13px] tracking-wide text-text-hi bg-volt/10 hover:bg-volt/20 border border-volt/30 rounded-full px-4 py-1.5 transition-colors"
          >
            {tab.label}
          </Link>
        </div>
      </div>
    </header>
  );
}