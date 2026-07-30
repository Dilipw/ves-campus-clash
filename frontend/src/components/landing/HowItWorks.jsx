import { motion } from "framer-motion";

const levels = [
  { n: "01", title: "Follow", copy: "Follow @ves.ac.in on Instagram." },
  { n: "02", title: "Register", copy: "Drop your name, institute & handle." },
  { n: "03", title: "Play", copy: "Clear the Memory Match Challenge." },
  { n: "04", title: "Share", copy: "Download your card, tag the page." },
];

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

        {/* rail */}
        <div className="relative mt-14 grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4">
          {/* connecting line — desktop only */}
          <div className="hidden sm:block absolute top-[22px] left-[12.5%] right-[12.5%] h-[2px] bg-ink-line">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "left" }}
              className="h-full bg-volt"
            />
          </div>

          {levels.map((lvl, i) => (
            <motion.div
              key={lvl.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex sm:flex-col gap-4 sm:gap-0 items-start"
            >
              <div className="relative z-10 shrink-0 sm:mb-5 w-11 h-11 rounded-full bg-ink-soft border border-ink-line flex items-center justify-center">
                <span className="font-mono text-[13px] font-medium text-volt">
                  {lvl.n}
                </span>
              </div>

              <div>
                <h3
                  className="font-display font-bold text-text-hi"
                  style={{ fontSize: "var(--fs-h3)" }}
                >
                  {lvl.title}
                </h3>
                <p className="mt-1 text-text-lo" style={{ fontSize: "var(--fs-body)" }}>
                  {lvl.copy}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
