import { motion } from "framer-motion";
import { FaInstagram } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { TOTAL_GAME_SECONDS } from "../../config/gameConfig";

export default function HeroSection() {
  const navigate = useNavigate();

  const handleContinue = () => {
    sessionStorage.setItem("followConfirmed", "true");
    navigate("/register");
  };

  return (
    <section className="relative px-5 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-20 overflow-hidden">
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
          className="mx-auto mt-4 max-w-lg text-text-lo"
          style={{ fontSize: "var(--fs-body-lg)" }}
        >
          Follow, register, clear a {TOTAL_GAME_SECONDS}-second Memory Match — walk
          away with a Story Card worth flexing on your feed.
        </motion.p>
      </div>

      {/* ---------- THE TICKET — now the actual gate, not decoration ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 28, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ rotate: 0, y: -4 }}
        className="relative mx-auto mt-12 max-w-md"
      >
        <div className="relative rounded-ticket bg-paper text-paper-hi shadow-ticket overflow-hidden">
          <span className="absolute -left-3 top-[34%] w-6 h-6 rounded-full bg-ink" />
          <span className="absolute -right-3 top-[34%] w-6 h-6 rounded-full bg-ink" />

          <div className="px-7 pt-6 pb-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-paper-lo">
                ADMIT ONE
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-punch">
                <span className="w-1.5 h-1.5 rounded-full bg-punch animate-pulse-dot" />
                LIVE ON CAMPUS
              </span>
            </div>

            <p className="mt-4 font-display font-bold text-2xl sm:text-[28px] tracking-tight">
              Campus Clash
            </p>
            <p className="mt-1 font-mono text-[13px] text-paper-lo">
              Memory Match · {TOTAL_GAME_SECONDS} sec run · one attempt only
            </p>
          </div>

          <div className="h-0 border-t-2 border-dashed" style={{ borderColor: "var(--paper-line)" }} />

          {/* stub becomes the action, not a static label */}
          <div className="px-7 pt-5 pb-6 bg-[#efe8d9] space-y-3">
            <a
              href="https://instagram.com/ves.ac.in"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 rounded-pill border border-paper-line bg-paper py-3.5 font-body font-medium text-paper-hi transition hover:border-punch/60"
            >
              <FaInstagram className="text-punch" />
              Follow @ves.ac.in
            </a>

            <button
              onClick={handleContinue}
              className="relative w-full rounded-pill bg-volt py-4 font-display font-bold text-ink tracking-tight transition hover:brightness-95 active:scale-[0.98]"
            >
              <span className="absolute inset-0 rounded-pill bg-volt opacity-40 blur-md -z-10" />
              I've followed — let's go
            </button>

            <p className="text-center text-[12px] text-paper-lo">
              We check this at the door. Skip it and registration won't unlock.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}