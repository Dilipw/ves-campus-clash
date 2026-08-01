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
      <div className="max-w-sm mx-auto text-center border-t border-ink-line pt-14">
        <h2
          className="font-display font-bold text-text-hi tracking-tight"
          style={{ fontSize: "var(--fs-h3)" }}
        >
          Ready when you are.
        </h2>
        <p className="mt-2 text-[14px] text-text-lo">
          Same two steps as above — follow, then jump straight into registration.
        </p>

        
        <a  href="https://instagram.com/ves.ac.in"
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2.5 rounded-pill border border-ink-line bg-ink-soft py-3.5 font-body font-medium text-text-hi transition hover:border-punch/60"
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
      </div>
    </section>
  );
}