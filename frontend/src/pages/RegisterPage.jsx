import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { participantApi, gameApi } from "../services/api";
import GameRulesModal from "../components/GameRulesModal";

// Shared input styling so every field looks identical and error state
// is applied in exactly one place instead of being repeated per-input.
const fieldClass = (hasError) =>
  `w-full bg-white border rounded-card px-3 py-2 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:bg-white transition-colors ${hasError ? "border-punch focus:ring-punch/50" : "border-paper-line focus:ring-punch/60"
  }`;

const labelClass = "block font-display text-[12px] uppercase tracking-wider mb-1 font-bold text-paper-hi";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="font-mono text-[11px] text-punch mt-1">{message}</p>;
}

export default function RegisterPage() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      full_name: "",
      institute: "",
      course: "",
      academic_year: "",
      instagram_handle: "",
      follow_confirmed: false,
      profile_photo: null,
    },
  });

 
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("participant") || "null");

    if (!stored?.uuid || !stored?.game_session?.uuid) {
      setCheckingSession(false);
      return;
    }

    gameApi
      .getStatus(stored.game_session.uuid)
      .then((res) => {
        const status = res.data?.data?.status || res.data?.status;

        if (status === "Completed") {
          navigate("/result", { replace: true });
        } else if (status === "InProgress" || status === "Registered") {
          navigate("/game", { replace: true });
        } else {
          localStorage.removeItem("participant");
          setCheckingSession(false);
        }
      })
      .catch(() => {
        // stale/invalid local data, let them re-register
        localStorage.removeItem("participant");
        setCheckingSession(false);
      });
  }, [navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setValue("profile_photo", file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue("profile_photo", null);
  };

  // Map a field-less server message to the form field it most likely refers to,
  // so the person sees the error right next to the input that caused it.
  const mapMessageToField = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes("instagram")) return "instagram_handle";
    if (lower.includes("name")) return "full_name";
    if (lower.includes("institute")) return "institute";
    if (lower.includes("course")) return "course";
    if (lower.includes("year")) return "academic_year";
    if (lower.includes("photo") || lower.includes("image")) return "profile_photo";
    return null;
  };

  const onSubmit = async (data) => {
    setApiError(null);
    clearErrors();

    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("institute", data.institute);
      formData.append("course", data.course);
      formData.append("academic_year", data.academic_year);
      formData.append("instagram_handle", data.instagram_handle);
      formData.append("follow_confirmed", data.follow_confirmed ? "1" : "0");

      if (data.profile_photo) {
        formData.append("profile_photo", data.profile_photo);
      }

      const response = await participantApi.register(formData);
      const participantData = response.data?.data || response.data;

      localStorage.setItem("participant", JSON.stringify(participantData));
      navigate("/game");
    } catch (error) {
      const payload = error.response?.data;

      if (error.response?.status === 422) {
   
        if (payload?.errors && typeof payload.errors === "object") {
          Object.keys(payload.errors).forEach((field) => {
            const fieldMessage = Array.isArray(payload.errors[field])
              ? payload.errors[field][0]
              : payload.errors[field];
            setError(field, { type: "server", message: fieldMessage });
          });
        } else if (payload?.message) {
  
          const targetField = mapMessageToField(payload.message);
          if (targetField) {
            setError(targetField, { type: "server", message: payload.message });
          } else {
            setApiError(payload.message);
          }
        } else {
          setApiError("Please check your details and try again.");
        }
      } else {
        setApiError(payload?.message || "Something went wrong. Please try again.");
      }
    }
  };

  // Avoid flashing the form while we confirm there's no active session
  if (checkingSession) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black px-4 sm:px-6 py-5 sm:py-5 font-body">
      <div className="max-w-5xl mx-auto">

        {/* Page heading — sits directly on the black body */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-volt font-bold">
            VES Campus Clash
          </span>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-white mt-2">
            Claim Your Ticket
          </h1>
          <p className="text-white/50 text-small mt-2">
            Register below to unlock the Memory Match Challenge.
          </p>
        </div>

        {/* The Ticket — info stub (left) joined to the registration coupon (right) */}
        <div className="relative flex flex-col lg:flex-row gap-4 lg:gap-0">

          {/* Perforation notches, desktop only, sit exactly on the seam */}
          <div className="hidden lg:block absolute -top-3 left-[380px] -translate-x-1/2 h-6 w-6 rounded-full bg-black z-10" />
          <div className="hidden lg:block absolute -bottom-3 left-[380px] -translate-x-1/2 h-6 w-6 rounded-full bg-black z-10" />

          {/* Stub — event info, order 2 on mobile so the form leads */}
          <div className="order-2 lg:order-1 lg:w-[380px] lg:shrink-0 bg-ink-soft border border-ink-line rounded-ticket lg:rounded-r-none lg:rounded-l-ticket p-5 sm:p-6 space-y-4">

            <div>
              <h2 className="font-display text-lg uppercase text-text-hi leading-tight">
                One Student. One Shot. One Score.
              </h2>
              <p className="text-text-lo text-small mt-1.5">
                Play one official Memory Match Challenge and earn your personalised
                Instagram Story Card.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 divide-x divide-ink-line border-y border-ink-line py-2.5">
              <div className="text-center">
                <span className="block font-display text-lg font-bold text-volt">2</span>
                <span className="font-mono text-[10px] uppercase text-text-lo tracking-wide">Levels</span>
              </div>
              <div className="text-center">
                <span className="block font-display text-lg font-bold text-punch">80s</span>
                <span className="font-mono text-[10px] uppercase text-text-lo tracking-wide">Base Time</span>
              </div>
              <div className="text-center">
                <span className="block font-display text-lg font-bold text-signal">1</span>
                <span className="font-mono text-[10px] uppercase text-text-lo tracking-wide">Attempt</span>
              </div>
            </div>

            {/* Journey */}
            <ol className="space-y-2 text-small text-text-hi">
              <li className="flex gap-3">
                <span className="font-mono text-volt font-bold shrink-0">01</span>
                <span>Register using your student details.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-volt font-bold shrink-0">02</span>
                <span>Play one continuous 2-level Memory Match Challenge.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-volt font-bold shrink-0">03</span>
                <span>Match every pair before the timer reaches zero.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-volt font-bold shrink-0">04</span>
                <span>Earn Combo Bonuses, Time Bonuses and Power-Up rewards.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-volt font-bold shrink-0">05</span>
                <span>Generate your Story Card and challenge your friends.</span>
              </li>
            </ol>

            {/* Fair Play */}
            <div className="border-t border-ink-line pt-3">
              <h3 className="font-display uppercase text-small text-volt mb-1.5">Fair Play</h3>
              <ul className="grid grid-cols-2 gap-y-1 gap-x-2 text-[13px] text-text-hi">
                <li>✓ One Registration</li>
                <li>✓ One Gameplay</li>
                <li>✓ One Final Score</li>
                <li>✓ Server Verified</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="w-full text-left text-volt hover:text-white font-mono text-[12px] uppercase tracking-wider cursor-pointer flex items-center justify-between gap-2 transition border-t border-ink-line pt-3"
            >
              <span>View Complete Rulebook</span>
              <span>→</span>
            </button>

            {/* Reward */}
            <div className="bg-paper/10 border border-paper-line/20 rounded-card p-3 flex items-start gap-3">
              <span className="text-punch text-xl shrink-0">🏆</span>
              <div>
                <p className="text-text-hi text-small font-semibold">Complete the Challenge</p>
                <p className="text-[12px] text-text-lo mt-1">
                  Unlock your personalised Instagram Story Card and show everyone your final score.
                </p>
              </div>
            </div>
          </div>

          {/* Coupon — the registration form, order 1 on mobile, right side on desktop */}
          <div className="order-1 lg:order-2 flex-1 min-w-0">
            <div className="bg-paper text-paper-hi rounded-ticket lg:rounded-l-none lg:rounded-r-ticket shadow-ticket border border-paper-line lg:border-l-0 overflow-hidden h-full">

              <header className="px-5 py-4 border-b border-dashed border-paper-line">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase text-punch font-bold tracking-widest">
                    Admit One
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-paper-lo shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-punch animate-pulse" />
                    Entry Form
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-h2 uppercase tracking-tight leading-tight">
                  Student Registration
                </h2>
                <p className="text-paper-lo text-small mt-1">
                  Takes under a minute · <span className="text-punch">*</span> required
                </p>
              </header>

              {apiError && (
                <div
                  role="alert"
                  className="mx-5 mt-4 flex items-start gap-2.5 p-3 bg-punch/10 border border-punch/40 rounded-card text-punch text-small font-mono"
                >
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span className="leading-snug">{apiError}</span>
                </div>
              )}

              <form
                id="registration-form"
                onSubmit={handleSubmit(onSubmit)}
                className="px-5 py-5 space-y-5"
                noValidate
              >
                {/* Section 1 — who you are */}
                <fieldset className="space-y-3">
                  <legend className="font-display text-[12px] uppercase tracking-widest text-paper-lo mb-1">
                    Your details
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label htmlFor="full_name" className={labelClass}>
                        Full Name <span className="text-punch">*</span>
                      </label>
                      <input
                        id="full_name"
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        aria-invalid={errors.full_name ? "true" : "false"}
                        {...register("full_name", { required: "Full name is required." })}
                        className={fieldClass(errors.full_name)}
                      />
                      <FieldError message={errors.full_name?.message} />
                    </div>

                    <div className="sm:col-span-4">
                      <label className={labelClass}>
                        Photo <span className="text-paper-lo font-normal normal-case">(optional)</span>
                      </label>
                      <div className="flex items-center gap-2.5 bg-white border border-paper-line rounded-card px-2.5 py-2 h-[46px]">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-paper-line"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-paper-line/30 flex items-center justify-center text-small shrink-0">
                            📷
                          </div>
                        )}
                        <label className="text-[12px] font-display uppercase tracking-wider text-punch cursor-pointer truncate font-bold flex-1">
                          {photoPreview ? "Change" : "Upload"}
                          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                        {photoPreview && (
                          <button
                            type="button"
                            onClick={removePhoto}
                            aria-label="Remove photo"
                            className="text-paper-lo hover:text-punch shrink-0 text-small leading-none"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Section 2 — academic info */}
                <fieldset className="space-y-3">
                  <legend className="font-display text-[12px] uppercase tracking-widest text-paper-lo mb-1">
                    Academic details
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="institute" className={labelClass}>
                        Institute <span className="text-punch">*</span>
                      </label>
                      <input
                        id="institute"
                        type="text"
                        placeholder="e.g. VESIT"
                        aria-invalid={errors.institute ? "true" : "false"}
                        {...register("institute", { required: "Institute is required." })}
                        className={fieldClass(errors.institute)}
                      />
                      <FieldError message={errors.institute?.message} />
                    </div>

                    <div>
                      <label htmlFor="course" className={labelClass}>
                        Course <span className="text-punch">*</span>
                      </label>
                      <input
                        id="course"
                        type="text"
                        placeholder="e.g. B.E. CS / B.Sc IT"
                        aria-invalid={errors.course ? "true" : "false"}
                        {...register("course", { required: "Course is required." })}
                        className={fieldClass(errors.course)}
                      />
                      <FieldError message={errors.course?.message} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="academic_year" className={labelClass}>
                      Academic Year <span className="text-punch">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="academic_year"
                        aria-invalid={errors.academic_year ? "true" : "false"}
                        {...register("academic_year", { required: "Academic year is required." })}
                        className={`${fieldClass(errors.academic_year)} pr-9 appearance-none cursor-pointer`}
                      >
                        <option value="">Select year</option>
                        <option value="FY">First Year (FY)</option>
                        <option value="SY">Second Year (SY)</option>
                        <option value="TY">Third Year (TY)</option>
                        <option value="Final">Final Year</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-paper-lo text-small">
                        ▼
                      </span>
                    </div>
                    <FieldError message={errors.academic_year?.message} />
                  </div>
                </fieldset>

                {/* Section 3 — social + confirmation */}
                <fieldset className="space-y-3">
                  <legend className="font-display text-[12px] uppercase tracking-widest text-paper-lo mb-1">
                    Instagram
                  </legend>

                  <div>
                    <label htmlFor="instagram_handle" className={labelClass}>
                      Instagram Handle <span className="text-punch">*</span>
                    </label>
                    <input
                      id="instagram_handle"
                      type="text"
                      placeholder="@username"
                      aria-invalid={errors.instagram_handle ? "true" : "false"}
                      {...register("instagram_handle", { required: "Instagram username is required." })}
                      className={fieldClass(errors.instagram_handle)}
                    />
                    <FieldError message={errors.instagram_handle?.message} />
                  </div>

                  <div className="bg-white border border-paper-line rounded-card p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        aria-invalid={errors.follow_confirmed ? "true" : "false"}
                        {...register("follow_confirmed", {
                          required: "Please confirm that you followed the Instagram page.",
                        })}
                        className="mt-0.5 h-4 w-4 rounded border-paper-line text-punch focus:ring-punch cursor-pointer shrink-0"
                      />
                      <span className="text-small text-paper-hi leading-tight">
                        I confirm that I follow the official <strong>@ves.ac.in</strong> Instagram page.{" "}
                        <span className="text-punch">*</span>
                      </span>
                    </label>
                    <FieldError message={errors.follow_confirmed?.message} />
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-punch hover:bg-punch-dim disabled:opacity-50 disabled:cursor-not-allowed text-text-hi rounded-pill py-3 font-display text-base sm:text-h3 tracking-wide uppercase transition-all transform active:scale-[0.98] shadow-soft cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    "Continue to Game →"
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}