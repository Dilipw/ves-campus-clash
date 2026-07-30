import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      full_name: "",
      institute: "",
      course: "",
      academic_year: "",
      instagram_handle: "",
      profile_photo: null,
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setValue("profile_photo", file);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log("Submitting registration data:", data);
      navigate("/game");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-body">
      
      {/* Grid container with items-stretch so both cards match height on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
        
        {/* Registration Form (Right on Desktop, Top on Mobile) */}
        <div className="lg:col-span-7 order-1 lg:order-2 w-full flex">
          
          <div className="bg-paper text-paper-hi rounded-ticket shadow-ticket p-4 sm:p-6 sm:px-8 border border-paper-line relative w-full flex flex-col justify-between">
            
            <div>
              {/* Header */}
              <header className="mb-4 border-b border-paper-line pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-small uppercase text-punch font-bold">
                    // VES CAMPUS CLASH
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-small text-paper-lo shrink-0">
                    <span className="h-2 w-2 rounded-full bg-punch animate-pulse" />
                    ENTRY FORM
                  </span>
                </div>

                <h1 className="font-display text-h2 uppercase tracking-tight leading-none">
                  Student Registration
                </h1>
              </header>

              {/* Form */}
              <form id="registration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                
                {/* Row 1: Full Name & Profile Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  
                  <div className="sm:col-span-8">
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Full Name <span className="text-punch">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      {...register("full_name", { required: "Full name is required" })}
                      className="w-full bg-white/80 border border-paper-line rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:ring-punch focus:bg-white transition"
                    />
                    {errors.full_name && (
                      <p className="font-mono text-small text-punch mt-0.5">
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Photo <span className="text-paper-lo font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-2 bg-white/80 border border-paper-line rounded-card p-1.5 px-2">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-paper-line/30 flex items-center justify-center text-small shrink-0">
                          📷
                        </div>
                      )}
                      <label className="text-small font-display uppercase tracking-wider text-ink hover:text-punch cursor-pointer truncate font-bold">
                        {photoPreview ? "Change" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>

                {/* Row 2: Institute & Course */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <div>
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Institute <span className="text-punch">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VESIT"
                      {...register("institute", { required: "Institute is required" })}
                      className="w-full bg-white/80 border border-paper-line rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:ring-punch focus:bg-white transition"
                    />
                    {errors.institute && (
                      <p className="font-mono text-small text-punch mt-0.5">
                        {errors.institute.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Course <span className="text-punch">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.E. CS / B.Sc IT"
                      {...register("course", { required: "Course is required" })}
                      className="w-full bg-white/80 border border-paper-line rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:ring-punch focus:bg-white transition"
                    />
                    {errors.course && (
                      <p className="font-mono text-small text-punch mt-0.5">
                        {errors.course.message}
                      </p>
                    )}
                  </div>

                </div>

                {/* Row 3: Academic Year & Instagram Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <div>
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Academic Year <span className="text-punch">*</span>
                    </label>
                    <div className="relative">
                      <select
                        {...register("academic_year", { required: "Select year" })}
                        className="w-full bg-white/80 border border-paper-line rounded-card p-2.5 pr-8 text-body text-paper-hi focus:outline-none focus:ring-2 focus:ring-punch focus:bg-white transition appearance-none cursor-pointer"
                      >
                        <option value="">Select Year</option>
                        <option value="FY">First Year (FY)</option>
                        <option value="SY">Second Year (SY)</option>
                        <option value="TY">Third Year (TY)</option>
                        <option value="Final">Final Year</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-paper-lo text-small">
                        ▼
                      </span>
                    </div>
                    {errors.academic_year && (
                      <p className="font-mono text-small text-punch mt-0.5">
                        {errors.academic_year.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-small uppercase tracking-wider mb-1 font-bold">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@username"
                      {...register("instagram_handle")}
                      className="w-full bg-white/80 border border-paper-line rounded-card p-2.5 text-body text-paper-hi placeholder:text-paper-lo/50 focus:outline-none focus:ring-2 focus:ring-punch focus:bg-white transition"
                    />
                  </div>

                </div>

              </form>
            </div>

            {/* Submit Button aligned at the bottom */}
            <button
              type="submit"
              form="registration-form"
              disabled={isSubmitting}
              className="w-full mt-4 bg-punch hover:bg-punch-dim disabled:opacity-50 text-text-hi rounded-pill py-3 font-display text-h3 tracking-wide uppercase transition-all transform active:scale-[0.98] shadow-soft cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Processing..." : "Continue to Game →"}
            </button>

          </div>

        </div>

        {/* Compact Game Highlights Sidebar (Left on Desktop, Bottom on Mobile) */}
        <div className="lg:col-span-5 order-2 lg:order-1 w-full flex">
          
          <div className="bg-ink-soft border border-ink-line rounded-card p-4 sm:p-5 flex flex-col justify-between w-full">
            
            <div>
              <span className="font-mono text-small text-volt uppercase tracking-widest font-bold block mb-0.5">
                // GAME OVERVIEW
              </span>
              <h2 className="font-display text-h3 uppercase text-text-hi leading-tight">
                Match, Score & Clash
              </h2>
              <p className="text-text-lo text-small mt-1">
                2-level memory challenge designed to test your speed & precision.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-1 border-y border-ink-line py-2.5 my-3">
                <div className="text-center">
                  <span className="block font-display text-body font-bold text-volt">2</span>
                  <span className="font-mono text-[11px] text-text-lo uppercase">Levels</span>
                </div>
                <div className="text-center border-x border-ink-line">
                  <span className="block font-display text-body font-bold text-punch">2-4</span>
                  <span className="font-mono text-[11px] text-text-lo uppercase">Mins</span>
                </div>
                <div className="text-center">
                  <span className="block font-display text-body font-bold text-signal">1</span>
                  <span className="font-mono text-[11px] text-text-lo uppercase">Card</span>
                </div>
              </div>

              {/* Rules List */}
              <ul className="space-y-1.5 text-small text-text-hi font-body">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-volt font-bold">01.</span>
                  <span>Flip & match pairs before the timer ends.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-volt font-bold">02.</span>
                  <span>Maintain streaks for <strong>Combo Bonus</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-volt font-bold">03.</span>
                  <span>Get extra time with <strong>Power-Up pairs</strong>.</span>
                </li>
              </ul>
            </div>

            {/* Compact Story Card Highlight */}
            <div className="bg-paper/10 border border-paper-line/20 rounded-card p-2.5 mt-3 flex items-center gap-2">
              <span className="text-punch text-body font-display">★</span>
              <p className="text-[12px] text-text-hi leading-tight">
                Clear Level 2 to unlock your shareable <strong>Instagram Story Card</strong>!
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}