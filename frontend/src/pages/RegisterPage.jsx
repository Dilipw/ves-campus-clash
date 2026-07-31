import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { participantApi, gameApi } from "../services/api";
import GameRulesModal from "../components/GameRulesModal";

export default function RegisterPage() {
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

  // If a participant already exists locally, don't trust it blindly —
  // ask the server what their real session status is and route accordingly.
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
        // Laravel-style field errors: { errors: { field: ["message"] } }
        if (payload?.errors && typeof payload.errors === "object") {
          Object.keys(payload.errors).forEach((field) => {
            const fieldMessage = Array.isArray(payload.errors[field])
              ? payload.errors[field][0]
              : payload.errors[field];
            setError(field, { type: "server", message: fieldMessage });
          });
        } else if (payload?.message) {
          // Single-message errors: { success: false, message: "..." }
          // e.g. "This Instagram handle is already registered."
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
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-punch border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">

        {/* Registration Form */}
        <div className="lg:col-span-7 order-1 lg:order-2 w-full">
          <div className="bg-paper text-paper-hi rounded-ticket shadow-ticket p-5 sm:p-8 border border-paper-line relative w-full">

            <header className="mb-5 sm:mb-6 border-b border-paper-line pb-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="font-mono text-[11px] sm:text-small uppercase text-punch font-bold tracking-widest">
                  // VES CAMPUS CLASH
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-small text-paper-lo shrink-0">
                  <span className="h-2 w-2 rounded-full bg-punch animate-pulse" />
                  ENTRY FORM
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-h2 uppercase tracking-tight leading-none">
                Student Registration
              </h1>
              <p className="text-paper-lo text-small mt-1.5">
                Fill in your details to unlock the game.
              </p>
            </header>

            {apiError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 p-3.5 bg-punch/10 border border-punch/40 rounded-card text-punch text-small font-mono"
              >
                <span className="shrink-0 mt-0.5">⚠</span>
                <span className="leading-snug">{apiError}</span>
              </div>
            )}

            <form id="registration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:items-start">
                <div className="sm:col-span-8">
                  <label htmlFor="full_name" className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Full Name <span className="text-punch">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    aria-invalid={errors.full_name ? "true" : "false"}
                    {...register("full_name", { required: "Full name is required." })}
                    className={`w-full bg-white/80 border rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:bg-white transition ${
                      errors.full_name
                        ? "border-punch focus:ring-punch/60"
                        : "border-paper-line focus:ring-punch"
                    }`}
                  />
                  {errors.full_name && (
                    <p className="font-mono text-[11px] sm:text-small text-punch mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Photo <span className="text-paper-lo font-normal normal-case">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2 bg-white/80 border border-paper-line rounded-card p-1.5 pl-1.5 pr-2.5 h-[42px]">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-paper-line" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-paper-line/30 flex items-center justify-center text-small shrink-0">
                        📷
                      </div>
                    )}
                    <label className="text-[11px] sm:text-small font-display uppercase tracking-wider text-ink hover:text-punch cursor-pointer truncate font-bold flex-1">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="institute" className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Institute <span className="text-punch">*</span>
                  </label>
                  <input
                    id="institute"
                    type="text"
                    placeholder="e.g. VESIT"
                    aria-invalid={errors.institute ? "true" : "false"}
                    {...register("institute", { required: "Institute is required." })}
                    className={`w-full bg-white/80 border rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:bg-white transition ${
                      errors.institute
                        ? "border-punch focus:ring-punch/60"
                        : "border-paper-line focus:ring-punch"
                    }`}
                  />
                  {errors.institute && (
                    <p className="font-mono text-[11px] sm:text-small text-punch mt-1">{errors.institute.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="course" className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Course <span className="text-punch">*</span>
                  </label>
                  <input
                    id="course"
                    type="text"
                    placeholder="e.g. B.E. CS / B.Sc IT"
                    aria-invalid={errors.course ? "true" : "false"}
                    {...register("course", { required: "Course is required." })}
                    className={`w-full bg-white/80 border rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:bg-white transition ${
                      errors.course
                        ? "border-punch focus:ring-punch/60"
                        : "border-paper-line focus:ring-punch"
                    }`}
                  />
                  {errors.course && (
                    <p className="font-mono text-[11px] sm:text-small text-punch mt-1">{errors.course.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="academic_year" className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Academic Year <span className="text-punch">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="academic_year"
                      aria-invalid={errors.academic_year ? "true" : "false"}
                      {...register("academic_year", { required: "Academic year is required." })}
                      className={`w-full bg-white/80 border rounded-card p-2.5 pr-8 text-body text-paper-hi focus:outline-none focus:ring-2 focus:bg-white transition appearance-none cursor-pointer ${
                        errors.academic_year
                          ? "border-punch focus:ring-punch/60"
                          : "border-paper-line focus:ring-punch"
                      }`}
                    >
                      <option value="">Select Year</option>
                      <option value="FY">First Year (FY)</option>
                      <option value="SY">Second Year (SY)</option>
                      <option value="TY">Third Year (TY)</option>
                      <option value="Final">Final Year</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-paper-lo text-small">▼</span>
                  </div>
                  {errors.academic_year && (
                    <p className="font-mono text-[11px] sm:text-small text-punch mt-1">{errors.academic_year.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="instagram_handle" className="block font-display text-small uppercase tracking-wider mb-1.5 font-bold">
                    Instagram Handle <span className="text-punch">*</span>
                  </label>
                  <input
                    id="instagram_handle"
                    type="text"
                    placeholder="@username"
                    aria-invalid={errors.instagram_handle ? "true" : "false"}
                    {...register("instagram_handle", { required: "Instagram username is required." })}
                    className={`w-full bg-white/80 border rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:bg-white transition ${
                      errors.instagram_handle
                        ? "border-punch focus:ring-punch/60"
                        : "border-paper-line focus:ring-punch"
                    }`}
                  />
                  {errors.instagram_handle && (
                    <p className="font-mono text-[11px] sm:text-small text-punch mt-1">{errors.instagram_handle.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    aria-invalid={errors.follow_confirmed ? "true" : "false"}
                    {...register("follow_confirmed", {
                      required: "Please confirm that you followed the Instagram page.",
                    })}
                    className="mt-0.5 h-4 w-4 rounded border-paper-line text-punch focus:ring-punch cursor-pointer shrink-0"
                  />
                  <span className="text-small text-paper-hi font-body leading-tight">
                    I confirm that I follow the official <strong>@ves_campus_clash</strong> Instagram page. <span className="text-punch">*</span>
                  </span>
                </label>
                {errors.follow_confirmed && (
                  <p className="font-mono text-[11px] sm:text-small text-punch mt-1.5">{errors.follow_confirmed.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-5 bg-punch hover:bg-punch-dim disabled:opacity-50 disabled:cursor-not-allowed text-text-hi rounded-pill py-3.5 font-display text-base sm:text-h3 tracking-wide uppercase transition-all transform active:scale-[0.98] shadow-soft cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Continue to Game →"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Game Highlights Sidebar */}
        <div className="lg:col-span-5 order-2 lg:order-1 w-full lg:sticky lg:top-6">
          <div className="bg-ink-soft border border-ink-line rounded-card p-4 sm:p-6 flex flex-col justify-between w-full">
            <div>
              <span className="font-mono text-[11px] sm:text-small text-volt uppercase tracking-widest font-bold block mb-1">
                // GAME OVERVIEW
              </span>
              <h2 className="font-display text-xl sm:text-h3 uppercase text-text-hi leading-tight">
                Match, Score & Clash
              </h2>
              <p className="text-text-lo text-small mt-1.5">
                2-level memory challenge designed to test your speed & precision.
              </p>

              <div className="grid grid-cols-3 gap-1 border-y border-ink-line py-3 my-4">
                <div className="text-center">
                  <span className="block font-display text-lg sm:text-body font-bold text-volt">2</span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-text-lo uppercase tracking-wide">Levels</span>
                </div>
                <div className="text-center border-x border-ink-line">
                  <span className="block font-display text-lg sm:text-body font-bold text-punch">2-4</span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-text-lo uppercase tracking-wide">Mins</span>
                </div>
                <div className="text-center">
                  <span className="block font-display text-lg sm:text-body font-bold text-signal">1</span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-text-lo uppercase tracking-wide">Card</span>
                </div>
              </div>

              <ul className="space-y-2 text-small text-text-hi font-body">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-volt font-bold shrink-0">01.</span>
                  <span>Flip & match pairs before the timer ends.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-volt font-bold shrink-0">02.</span>
                  <span>Maintain streaks for <strong>Combo Bonus</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-volt font-bold shrink-0">03.</span>
                  <span>Get extra time with <strong>Power-Up pairs</strong>.</span>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-ink-line/50">
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(true)}
                  className="text-volt hover:text-white font-mono text-[11px] sm:text-[12px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition"
                >
                  <span>View Full Rulebook & Scoring</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="bg-paper/10 border border-paper-line/20 rounded-card p-3 mt-4 flex items-center gap-2.5">
              <span className="text-punch text-body font-display shrink-0">★</span>
              <p className="text-[12px] text-text-hi leading-tight">
                Clear Level 2 to unlock your shareable <strong>Instagram Story Card</strong>!
              </p>
            </div>
          </div>
        </div>

      </div>

      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}