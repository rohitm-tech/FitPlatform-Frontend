import { useAuth } from "../../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../services/endpoints/userApi";
import { useAppDispatch } from "../../store/hooks";
import { bootstrapAuth } from "../../store/slices/authSlice";
import type { UserProfile } from "../../types/domain";

const SPORTS = [
  "Strength",
  "Running",
  "Swimming",
  "Cricket",
  "Football",
  "HYROX",
  "CrossFit",
  "Yoga",
  "Pilates",
  "Cycling",
  "Boxing",
  "Martial Arts",
  "Tennis",
  "Badminton",
  "Basketball",
  "Climbing",
  "Calisthenics",
  "Dance",
  "Triathlon",
  "Squash",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Bengali",
];

const EQUIPMENT = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "cable",
  "machine",
  "plate",
];

const GOAL_OPTIONS: {
  value: NonNullable<UserProfile["goal"]>;
  label: string;
}[] = [
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "fat_loss", label: "Fat loss" },
  { value: "strength", label: "Strength" },
  { value: "general_fitness", label: "General fitness" },
  { value: "race", label: "A race or event" },
];

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const profile = user?.profile;
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(profile?.location?.city || "");
  const [area, setArea] = useState(profile?.location?.area || "");
  const [about, setAbout] = useState(profile?.about || "");
  const [languages, setLanguages] = useState<string[]>(profile?.languages || []);
  const [sports, setSports] = useState<string[]>(profile?.sports || []);
  const [goal, setGoal] = useState<UserProfile["goal"]>(
    profile?.goal || "general_fitness",
  );
  const [experienceLevel, setExperienceLevel] = useState<
    UserProfile["experienceLevel"]
  >(profile?.experienceLevel || "beginner");
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(
    profile?.trainingDaysPerWeek || 3,
  );
  const [trainingSetting, setTrainingSetting] = useState<
    NonNullable<UserProfile["trainingSetting"]>
  >(profile?.trainingSetting || "either");
  const [equipmentAccess, setEquipmentAccess] = useState<string[]>(
    profile?.equipmentAccess?.length ? profile.equipmentAccess : ["bodyweight"],
  );
  const [availability, setAvailability] = useState(profile?.availability || "");
  const [heightCm, setHeightCm] = useState(
    profile?.heightCm ? String(profile.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    profile?.weightKg ? String(profile.weightKg) : "",
  );
  const [budget, setBudget] = useState(
    profile?.budgetMonthlyInr ? String(profile.budgetMonthlyInr) : "",
  );
  const [injuries, setInjuries] = useState(profile?.injuries || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Add your name so a coach knows who they are talking to.");
      return;
    }
    if (!equipmentAccess.length) {
      setError(
        "Choose the equipment you have access to, including bodyweight if you train without equipment.",
      );
      return;
    }
    const height = numberOrNull(heightCm);
    const weight = numberOrNull(weightKg);
    const monthly = numberOrNull(budget);
    if (heightCm.trim() && (height == null || height <= 0)) {
      setError("Height needs to be a number in centimetres.");
      return;
    }
    if (weightKg.trim() && (weight == null || weight <= 0)) {
      setError("Weight needs to be a number in kilograms.");
      return;
    }
    if (budget.trim() && (monthly == null || monthly < 0)) {
      setError("Budget needs to be a number in rupees, or left blank.");
      return;
    }
    const savedCity = profile?.location?.city || "";
    const savedArea = profile?.location?.area || "";
    const placeUnchanged = city.trim() === savedCity && area.trim() === savedArea;
    setIsSubmitting(true);
    try {
      await userApi.completeOnboarding({
        name: name.trim(),
        about: about.trim(),
        languages,
        sports,
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        trainingSetting,
        equipmentAccess,
        availability: availability.trim(),
        heightCm: height,
        weightKg: weight,
        budgetMonthlyInr: monthly,
        injuries,
        location: {
          city: city.trim(),
          area: area.trim(),
          latitude: placeUnchanged ? profile?.location?.latitude ?? null : null,
          longitude: placeUnchanged ? profile?.location?.longitude ?? null : null,
        },
      });
      await dispatch(bootstrapAuth());
      if (user?.onboardingCompleted) {
        setSavedAt(new Date());
      } else {
        navigate("/athlete", { replace: true });
      }
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
      <header className="page-greeting">
        <div>
          <h1>Your training profile</h1>
          <p>
            What you train for, where you are, and how a coach should work with
            you. Skip anything you would rather decide later.
          </p>
        </div>
      </header>
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
      <form className="onboarding-grid" onSubmit={handleSubmit}>
        <section className="onboarding-panel">
          <h2>You</h2>
          <p>Name and a short note are enough for a coach to start a conversation.</p>
          <div className="onboarding-fields">
            <div className="span-2">
              <label className="fp-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="fp-input"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="city">
                City
              </label>
              <input
                id="city"
                className="fp-input"
                maxLength={60}
                autoComplete="address-level2"
                placeholder="Bengaluru"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="area">
                Neighbourhood
              </label>
              <input
                id="area"
                className="fp-input"
                maxLength={80}
                placeholder="Indiranagar"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              />
            </div>
            <div className="span-2">
              <fieldset>
                <legend className="fp-label">Languages</legend>
                <div className="onboarding-equipment">
                  {LANGUAGES.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={languages.includes(value)}
                        onChange={() => setLanguages(toggle(languages, value))}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="span-2">
              <label className="fp-label" htmlFor="about">
                What you are doing now
              </label>
              <textarea
                id="about"
                className="fp-input"
                rows={4}
                maxLength={1000}
                placeholder="Training for a 10K, or getting back into the gym after a break."
                value={about}
                onChange={(event) => setAbout(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="onboarding-panel">
          <h2>Training</h2>
          <p>Sports and equipment decide which coaches and plans fit.</p>
          <div className="onboarding-fields">
            <div className="span-2">
              <fieldset>
                <legend className="fp-label">Sports you are interested in</legend>
                <div className="onboarding-equipment">
                  {SPORTS.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={sports.includes(value)}
                        onChange={() => setSports(toggle(sports, value))}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div>
              <label className="fp-label" htmlFor="goal">
                Goal
              </label>
              <select
                id="goal"
                className="fp-input"
                value={goal}
                onChange={(event) =>
                  setGoal(event.target.value as UserProfile["goal"])
                }
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
                Experience
              </label>
              <select
                id="experience"
                className="fp-input"
                value={experienceLevel}
                onChange={(event) =>
                  setExperienceLevel(
                    event.target.value as UserProfile["experienceLevel"],
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
                Days per week
              </label>
              <input
                id="days"
                type="number"
                required
                min={1}
                max={7}
                className="fp-input"
                value={trainingDaysPerWeek}
                onChange={(event) =>
                  setTrainingDaysPerWeek(Number(event.target.value))
                }
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="setting">
                Where you train
              </label>
              <select
                id="setting"
                className="fp-input"
                value={trainingSetting}
                onChange={(event) =>
                  setTrainingSetting(
                    event.target.value as NonNullable<
                      UserProfile["trainingSetting"]
                    >,
                  )
                }
              >
                <option value="either">In person or online</option>
                <option value="in_person">In person</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="span-2">
              <fieldset>
                <legend className="fp-label">Equipment you can use</legend>
                <div className="onboarding-equipment">
                  {EQUIPMENT.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={equipmentAccess.includes(value)}
                        onChange={() =>
                          setEquipmentAccess(toggle(equipmentAccess, value))
                        }
                      />
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </section>

        <section className="onboarding-panel onboarding-wide">
          <h2>Optional</h2>
          <p>Useful when you want a plan or a fee that fits. Leave these blank if you prefer.</p>
          <div className="onboarding-fields onboarding-optional">
            <div>
              <label className="fp-label" htmlFor="height">
                Height (cm)
              </label>
              <input
                id="height"
                className="fp-input"
                inputMode="decimal"
                placeholder="Optional"
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="weight">
                Weight (kg)
              </label>
              <input
                id="weight"
                className="fp-input"
                inputMode="decimal"
                placeholder="Optional"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="budget">
                Monthly budget (₹)
              </label>
              <input
                id="budget"
                className="fp-input"
                inputMode="numeric"
                placeholder="Optional"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </div>
            <div>
              <label className="fp-label" htmlFor="availability">
                When you can train
              </label>
              <input
                id="availability"
                className="fp-input"
                maxLength={200}
                placeholder="Weekday mornings"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              />
            </div>
            <div className="span-2">
              <label className="fp-label" htmlFor="injuries">
                Injuries or limitations
              </label>
              <textarea
                id="injuries"
                className="fp-input"
                rows={3}
                maxLength={2000}
                value={injuries}
                onChange={(event) => setInjuries(event.target.value)}
              />
              <p className="onboarding-note">
                Used to tailor training guidance. The app does not diagnose or
                treat injuries.
              </p>
            </div>
          </div>
          <div className="onboarding-actions">
            {savedAt && !isSubmitting ? (
              <span className="onboarding-saved" role="status">
                Saved at{" "}
                {savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action"
            >
              {isSubmitting ? "Saving…" : "Save profile"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
