import { useAuth } from "../../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../services/endpoints/userApi";
import { useAppDispatch } from "../../store/hooks";
import { bootstrapAuth } from "../../store/slices/authSlice";
import type { UserProfile } from "../../types/domain";

const GOAL_OPTIONS: {
  value: NonNullable<UserProfile["goal"]>;
  label: string;
}[] = [
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "fat_loss", label: "Fat loss" },
  { value: "strength", label: "Strength" },
  { value: "general_fitness", label: "General fitness" },
  { value: "race", label: "Race" },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [goal, setGoal] = useState<UserProfile["goal"]>(
    user?.profile.goal || "general_fitness",
  );
  const [experienceLevel, setExperienceLevel] = useState<
    UserProfile["experienceLevel"]
  >(user?.profile.experienceLevel || "beginner");
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(
    user?.profile.trainingDaysPerWeek || 3,
  );
  const [equipmentAccess, setEquipmentAccess] = useState(
    (user?.profile.equipmentAccess || ["bodyweight"]).join(","),
  );
  const [injuries, setInjuries] = useState(user?.profile.injuries || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!equipmentAccess) {
      setError(
        "Choose the equipment you have access to, including bodyweight if you train without equipment.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await userApi.completeOnboarding({
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        equipmentAccess: equipmentAccess
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        injuries,
      });
      await dispatch(bootstrapAuth());
      navigate("/athlete", { replace: true });
    } catch {
      setError(
        "Your training profile could not be saved. Your entries are still here. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-page onboarding-page">
      <h1 className="font-display text-2xl font-semibold">
        Tell us about your training
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Your goals and available equipment help shape a more useful training
        plan.
      </p>
      {error && (
        <div
          className="form-feedback"
          ref={errorRef}
          tabIndex={-1}
          role="alert"
        >
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="fp-label" htmlFor="goal">
            Goal
          </label>
          <select
            id="goal"
            className="fp-input"
            value={goal}
            onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
          >
            {GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fp-label" htmlFor="experience">
            Experience level
          </label>
          <select
            id="experience"
            className="fp-input"
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(
                e.target.value as UserProfile["experienceLevel"],
              )
            }
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="fp-label" htmlFor="days">
            Training days per week
          </label>
          <input
            id="days"
            type="number"
            required
            min={1}
            max={7}
            className="fp-input"
            value={trainingDaysPerWeek}
            onChange={(e) => setTrainingDaysPerWeek(Number(e.target.value))}
          />
        </div>
        <div>
          <fieldset>
            <legend className="fp-label">Equipment you can use</legend>
            <div className="onboarding-equipment">
              {[
                "bodyweight",
                "dumbbell",
                "barbell",
                "cable",
                "machine",
                "plate",
              ].map((value) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={equipmentAccess.split(",").includes(value)}
                    onChange={() => {
                      const values = equipmentAccess.split(",").filter(Boolean);
                      setEquipmentAccess(
                        values.includes(value)
                          ? values.filter((x) => x !== value).join(",")
                          : [...values, value].join(","),
                      );
                    }}
                  />
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div>
          <label className="fp-label" htmlFor="injuries">
            Injuries or limitations (optional)
          </label>
          <textarea
            id="injuries"
            className="fp-input"
            rows={3}
            maxLength={2000}
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--fp-text-muted)" }}>
            Used to tailor training guidance and highlight when professional
            advice is needed. AI does not diagnose or treat injuries.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: "var(--fp-border)" }}
        >
          {isSubmitting ? "Saving…" : "Save training profile"}
        </button>
      </form>
    </div>
  );
}
