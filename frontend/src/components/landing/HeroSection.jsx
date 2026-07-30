import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative px-5 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      {/* ambient glow — one, quiet, behind the ticket */}
      <div
        className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 w-[560px] h-[560px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--volt), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[12px] tracking-[0.2em] text-volt-dim sm:text-volt uppercase"
        >
          Scan → Follow → Play → Win
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-4 font-display font-bold leading-[0.95] tracking-tight text-text-hi"
          style={{ fontSize: "var(--fs-display-xl)" }}
        >
          One shot.
          <br />
          <span className="text-volt">One score.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-5 max-w-lg text-text-lo"
          style={{ fontSize: "var(--fs-body-lg)" }}
        >
          Register, clear the Memory Match Challenge, and walk away with a
          Story Card worth flexing on your feed.
        </motion.p>
      </div>

      {/* ---------- THE TICKET ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 28, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ rotate: 0, y: -4 }}
        className="relative mx-auto mt-14 max-w-md"
      >
        <div className="relative rounded-ticket bg-paper text-paper-hi shadow-ticket overflow-hidden">
          {/* punch-hole notches */}
          <span className="absolute -left-3 top-[38%] w-6 h-6 rounded-full bg-ink" />
          <span className="absolute -right-3 top-[38%] w-6 h-6 rounded-full bg-ink" />

          {/* main panel */}
          <div className="px-7 pt-6 pb-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-paper-lo">
                ADMIT ONE
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-punch">
                <span className="w-1.5 h-1.5 rounded-full bg-punch animate-pulse-dot" />
                LIVE
              </span>
            </div>

            <p className="mt-4 font-display font-bold text-2xl sm:text-[28px] tracking-tight">
              Campus Clash
            </p>
            <p className="mt-1 font-mono text-[13px] text-paper-lo">
              Memory Match · 60 sec run
            </p>
          </div>

          {/* perforation */}
          <div
            className="h-0 border-t-2 border-dashed"
            style={{ borderColor: "var(--paper-line)" }}
          />

          {/* stub */}
          <div className="px-7 py-4 flex items-center justify-between bg-[#efe8d9]">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-paper-lo">
                TICKET NO.
              </p>
              <p className="font-mono text-sm font-medium">VES-CC-2026</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-widest text-paper-lo">
                VENUE
              </p>
              <p className="font-mono text-sm font-medium">Your Phone</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
