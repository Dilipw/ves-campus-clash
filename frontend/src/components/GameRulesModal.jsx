import React from "react";

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
              Identify and match identical card pairs before the timer expires. Complete both Level 1 and Level 2 in a single continuous <strong>2 to 4-minute session</strong> to generate your shareable Story Card.
            </p>
          </div>

          {/* Section 2: Level Progression */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              02. Level Structure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-white/60 border border-paper-line p-3 rounded-card">
                <span className="font-mono text-volt-dim font-bold text-small block uppercase">
                  Level 1 — Warmup
                </span>
                <p className="text-paper-lo text-[13px] mt-1">
                  Smaller grid of pairs with relaxed timer limits. Designed to let you build confidence and secure your initial score.
                </p>
              </div>

              <div className="bg-white/60 border border-paper-line p-3 rounded-card">
                <span className="font-mono text-punch font-bold text-small block uppercase">
                  Level 2 — Clash Challenge
                </span>
                <p className="text-paper-lo text-[13px] mt-1">
                  Automatically unlocks after clearing Level 1. Features a larger card grid, faster countdown timer, and tighter decision windows.
                </p>
              </div>
            </div>
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
            </ul>
          </div>

          {/* Section 4: Game Over & Story Card */}
          <div className="space-y-2">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              04. Completion & Rewards
            </h3>
            <p className="text-paper-lo">
              If the countdown timer reaches zero before all pairs are matched, the game ends immediately and computes your current score. Upon clearing Level 2, your custom <strong>VES Campus Clash Story Card</strong> is generated with your name, score, and rank rank ready for Instagram sharing.
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