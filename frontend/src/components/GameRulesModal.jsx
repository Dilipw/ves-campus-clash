import React from "react";
import { LEVELS, TOTAL_GAME_SECONDS } from "../config/gameConfig";

export default function GameRulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in font-body">
      
      {/* Modal Ticket Box */}
      <div className="bg-paper text-paper-hi rounded-ticket shadow-ticket w-full max-w-2xl max-h-[85vh] flex flex-col border border-paper-line overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-paper-line flex justify-between items-center bg-paper sticky top-0 z-10">
          <div>
            <span className="font-mono text-small uppercase text-punch font-bold block">
              // GAME RULEBOOK & DETAILS
            </span>
            <h2 className="font-display text-h2 uppercase text-paper-hi leading-none mt-1">
              Memory Match Challenge
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink text-text-hi hover:bg-punch font-display text-h3 flex items-center justify-center transition cursor-pointer"
            aria-label="Close rules modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-small text-paper-hi leading-relaxed">
          
          {/* Section 1: Objective & Duration */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              01. Objective & Duration
            </h3>
            <p className="text-paper-lo">
              Identify and match identical card pairs before the timer expires. Complete both Level 1 and Level 2 in a single continuous session —{" "}
              <strong>{TOTAL_GAME_SECONDS} seconds total</strong> across both levels — to generate your shareable Story Card.
            </p>
          </div>

          {/* Section 2: Level Progression — numbers pulled from gameConfig so
              this can never say something different from the actual game. */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              02. Level Structure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {LEVELS.map((level, i) => (
                <div key={level.id} className="bg-white/60 border border-paper-line p-3 rounded-card">
                  <span
                    className={`font-mono font-bold text-small block uppercase ${
                      i === 0 ? "text-volt-dim" : "text-punch"
                    }`}
                  >
                    {level.shortLabel} — {level.name}
                  </span>
                  <p className="text-paper-lo text-[13px] mt-1">
                    {level.grid.rows} × {level.grid.cols} grid · {level.pairs} pairs to match ·{" "}
                    {level.timerSeconds}-second timer
                    {i > 0 && " · unlocks automatically after clearing the previous level"}.
                  </p>
                </div>
              ))}
            </div>
            <p className="text-paper-lo text-[13px] mt-2">
              Progress continues automatically between levels — no restart, no re-registration.
            </p>
          </div>

          {/* Section 3: Scoring & Mechanics */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              03. Scoring, Combos & Power-Ups
            </h3>
            
            <ul className="space-y-2 list-disc list-inside text-paper-lo">
              <li>
                <strong className="text-paper-hi">Base Score:</strong> Points earned for every correctly matched pair.
              </li>
              <li>
                <strong className="text-paper-hi">Combo Multiplier:</strong> Consecutive successful matches without missing increase your multiplier score bonus.
              </li>
              <li>
                <strong className="text-paper-hi">Time Bonus:</strong> Unused seconds when completing a level are converted into extra bonus points.
              </li>
              <li>
                <strong className="text-punch">⚡ Power-Up Pair:</strong> Matching special golden Power-Up cards instantly adds extra seconds to your active countdown timer.
              </li>
              <li>
                <strong className="text-paper-hi">Moves:</strong> Every time you flip two cards, one move is counted — fewer moves means sharper memory and a better efficiency read on your run.
              </li>
            </ul>
          </div>

          {/* Section 4: Game Over & Story Card */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              04. Completion & Rewards
            </h3>
            <p className="text-paper-lo">
              The game ends the moment all required pairs are matched, or the countdown timer reaches zero — whichever comes first. Your score is calculated and saved automatically at that instant. Clearing Level 2 unlocks your custom{" "}
              <strong>VES Campus Clash Story Card</strong> — your name, score, and stats, ready to share on Instagram.
            </p>
          </div>

          {/* Section 5: Fair Play */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              05. One Shot, One Score
            </h3>
            <p className="text-paper-lo">
              One registration, one gameplay session, one final score — no replays. Every result is validated and recorded server-side, so play it exactly as you mean to submit it.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-paper-line bg-paper flex justify-end">
          <button
            onClick={onClose}
            className="bg-punch hover:bg-punch-dim text-text-hi font-display text-small uppercase tracking-wider px-6 py-2.5 rounded-pill transition cursor-pointer"
          >
            Got It, Let's Play →
          </button>
        </div>

      </div>

    </div>
  );
}