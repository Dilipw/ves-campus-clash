import { Fragment } from "react";
import { motion } from "framer-motion";

const levels = [
  { n: "01", title: "Follow", copy: "Follow @ves.ac.in on Instagram." },
  { n: "02", title: "Register", copy: "Drop your name, institute & handle." },
  { n: "03", title: "Play", copy: "Clear the Memory Match Challenge." },
  { n: "04", title: "Share", copy: "Download your card, tag the page." },
];

function StepNode({ lvl, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.18 }}
      className="flex flex-col items-start shrink-0 w-32 sm:w-40"
    >
      <div className="w-11 h-11 rounded-full bg-ink-soft border border-ink-line flex items-center justify-center">
        <span className="font-mono text-[13px] font-medium text-volt">{lvl.n}</span>
      </div>
      <h3 className="mt-5 font-display font-bold text-text-hi" style={{ fontSize: "var(--fs-h3)" }}>
        {lvl.title}
      </h3>
      <p className="mt-1 text-text-lo pr-2" style={{ fontSize: "var(--fs-body)" }}>
        {lvl.copy}
      </p>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section className="px-5 sm:px-6 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display font-bold text-text-hi tracking-tight text-center"
          style={{ fontSize: "var(--fs-h2)" }}
        >
          Four levels. No skipping.
        </h2>

        {/* ---------- Desktop: horizontal flow, line grows between nodes ---------- */}
        <div className="hidden sm:flex items-start mt-14">
          {levels.map((lvl, i) => (
            <Fragment key={lvl.n}>
              <StepNode lvl={lvl} index={i} />
              {i < levels.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="h-[2px] flex-1 bg-volt mt-[21px] origin-left"
                />
              )}
            </Fragment>
          ))}
        </div>

        {/* ---------- Mobile: vertical flow, line grows downward between nodes ---------- */}
        <div className="sm:hidden mt-10">
          {levels.map((lvl, i) => (
            <div key={lvl.n} className="relative flex gap-4 pb-8 last:pb-0">
              {i < levels.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-[21px] top-11 bottom-0 w-[2px] bg-volt origin-top"
                />
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.15 }}
                className="relative z-10 shrink-0 w-11 h-11 rounded-full bg-ink-soft border border-ink-line flex items-center justify-center"
              >
                <span className="font-mono text-[13px] font-medium text-volt">{lvl.n}</span>
              </motion.div>
              <div className="pt-1.5">
                <h3 className="font-display font-bold text-text-hi" style={{ fontSize: "var(--fs-h3)" }}>
                  {lvl.title}
                </h3>
                <p className="mt-1 text-text-lo" style={{ fontSize: "var(--fs-body)" }}>
                  {lvl.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}