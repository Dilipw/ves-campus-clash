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
                    className={`font-mono font-bold text-small block uppercase ${i === 0 ? "text-volt-dim" : "text-punch"
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

          {/* Section 3: Scoring System */}
          <div className="space-y-3">
            <h3 className="font-display text-h3 uppercase text-paper-hi border-b border-paper-line/50 pb-1">
              03. Scoring System
            </h3>

            <div className="bg-white/60 border border-paper-line rounded-card p-4">
              <p className="font-display text-paper-hi uppercase text-small mb-3">
                Final Score Formula
              </p>

              <div className="bg-ink text-text-hi rounded-card p-3 font-mono text-[13px] overflow-x-auto">
                Final Score = (Matched Pairs × 100)
                <br />+ (Remaining Time × 5)
                <br />− ((Moves − Matched Pairs) × 5)
              </div>

              <p className="text-paper-lo text-[13px] mt-3">
                Your final score is calculated automatically by the server as soon as
                your game ends. The higher your efficiency and the faster you finish,
                the better your score.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="border border-paper-line rounded-card p-3 bg-white/50">
                <h4 className="font-display text-small uppercase text-paper-hi">
                  🎯 Matched Pairs
                </h4>
                <p className="text-paper-lo text-[13px] mt-1">
                  Every correctly matched pair earns <strong>100 points</strong>.
                  Completing more pairs increases your base score.
                </p>
              </div>

              <div className="border border-paper-line rounded-card p-3 bg-white/50">
                <h4 className="font-display text-small uppercase text-paper-hi">
                  ⏱ Time Bonus
                </h4>
                <p className="text-paper-lo text-[13px] mt-1">
                  Every unused second remaining at the end of your game adds
                  <strong> 5 bonus points</strong>.
                </p>
              </div>

              <div className="border border-paper-line rounded-card p-3 bg-white/50">
                <h4 className="font-display text-small uppercase text-paper-hi">
                  🔄 Move Penalty
                </h4>
                <p className="text-paper-lo text-[13px] mt-1">
                  Extra moves reduce your score.
                  Every move beyond your matched pairs deducts
                  <strong> 5 points</strong>.
                </p>
              </div>

              <div className="border border-paper-line rounded-card p-3 bg-white/50">
                <h4 className="font-display text-small uppercase text-punch">
                  ⚡ Power-Up Card
                </h4>
                <p className="text-paper-lo text-[13px] mt-1">
                  Matching the special Power-Up pair instantly adds
                  <strong> +5 seconds</strong> to your remaining game time,
                  giving you a better chance to earn more bonus points.
                </p>
              </div>

            </div>

            <div className="rounded-card border border-paper-line bg-volt/10 p-3">
              <p className="text-paper-lo text-[13px]">
                <strong className="text-paper-hi">Example:</strong><br />
                Matched Pairs: <strong>10</strong><br />
                Moves: <strong>56</strong><br />
                Remaining Time: <strong>0 sec</strong><br /><br />

                Score = (10 × 100) + (0 × 5) − ((56 − 10) × 5)
                <br />
                <strong className="text-paper-hi">Final Score = 770</strong>
              </p>
            </div>
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