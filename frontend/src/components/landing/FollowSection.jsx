import { FaInstagram } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function FollowSection() {
  const navigate = useNavigate();

  const handleContinue = () => {
    sessionStorage.setItem("followConfirmed", "true");
    navigate("/register");
  };

  return (
    <section className="px-5 sm:px-6 pb-24">
      <div className="max-w-sm mx-auto text-center">
        <p className="font-mono text-[11px] tracking-widest text-text-lo uppercase">
          Step 01 of 04
        </p>
        <h2
          className="mt-2 font-display font-bold text-text-hi tracking-tight"
          style={{ fontSize: "var(--fs-h3)" }}
        >
          Unlock registration
        </h2>

        <a
          href="https://instagram.com/ves.ac.in"
          target="_blank"
          rel="noreferrer"
          className="mt-7 flex items-center justify-center gap-2.5 rounded-pill border border-ink-line bg-ink-soft py-3.5 font-body font-medium text-text-hi transition hover:border-punch/60"
        >
          <FaInstagram className="text-punch" />
          Follow @ves.ac.in
        </a>

        <button
          onClick={handleContinue}
          className="relative mt-3 w-full rounded-pill bg-volt py-4 font-display font-bold text-ink tracking-tight transition hover:brightness-95 active:scale-[0.98]"
        >
          <span className="absolute inset-0 rounded-pill bg-volt opacity-40 blur-md -z-10" />
          I've followed — let's go
        </button>

        <p className="mt-4 text-[13px] text-text-lo">
          We check this at the door. Skip it and you won't get past
          registration.
        </p>
      </div>
    </section>
  );
}
