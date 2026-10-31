import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import "../../coaches.css";
const choices = [
  "Strength",
  "Weight management",
  "Running",
  "Hybrid",
  "Mobility",
  "General fitness",
];
export default function CoachProfilePage() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["coach-public-profile", user?._id],
    queryFn: async () => (await api.get("/coaches/me")).data.data,
  });
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    specialties: [] as string[],
    location: "",
    languages: "English",
    experienceYears: "",
    remoteAvailable: true,
    acceptingAthletes: true,
    isPublic: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (query.data)
      setForm({
        ...query.data,
        languages: query.data.languages.join(", "),
        experienceYears:
          query.data.experienceYears == null
            ? ""
            : String(query.data.experienceYears),
      });
  }, [query.data]);
  const field = (key: string, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  return (
    <div className="product-page">
      <Link className="page-back" to="/coach">
        <ArrowLeft size={16} />
        Team workspace
      </Link>
      <div className="page-greeting">
        <div>
          <h1>Your coach profile</h1>
          <p>
            Help athletes understand your approach and find your coaching
            packages.
          </p>
        </div>
        {query.data?.isPublic && (
          <Link className="secondary-action" to={`/coaches/${user?._id}`}>
            View public profile
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading your profile…
        </div>
      ) : query.isError ? (
        <div className="page-state">
          <p>Your profile couldn’t be loaded.</p>
          <button onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : (
        <div className="two-column-page">
          <form
            className="page-section"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setSaved(false);
              if (!form.specialties.length) {
                setError("Choose at least one coaching specialty.");
                return;
              }
              setBusy(true);
              try {
                await api.put("/coaches/me", {
                  headline: form.headline,
                  bio: form.bio,
                  specialties: form.specialties,
                  location: form.location,
                  languages: form.languages
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                  ...(form.experienceYears !== ""
                    ? { experienceYears: Number(form.experienceYears) }
                    : {}),
                  remoteAvailable: form.remoteAvailable,
                  acceptingAthletes: form.acceptingAthletes,
                  isPublic: form.isPublic,
                });
                await cache.invalidateQueries({
                  queryKey: ["coach-public-profile"],
                });
                cache.invalidateQueries({ queryKey: ["coach-directory"] });
                setSaved(true);
              } catch (e: any) {
                setError(
                  e.response?.data?.errors?.[0] ||
                    e.response?.data?.message ||
                    "Profile could not be saved. Your edits are still here.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Your approach</h2>
            <label className="fp-label mt-5" htmlFor="coach-headline">
              Profile headline
            </label>
            <input
              id="coach-headline"
              className="fp-input"
              required
              minLength={5}
              maxLength={120}
              value={form.headline}
              onChange={(e) => field("headline", e.target.value)}
              placeholder="Who you help and how"
            />
            <label className="fp-label mt-5" htmlFor="coach-bio">
              About your coaching
            </label>
            <textarea
              id="coach-bio"
              className="fp-input"
              rows={6}
              required
              minLength={20}
              maxLength={3000}
              value={form.bio}
              onChange={(e) => field("bio", e.target.value)}
            />
            <fieldset className="mt-5">
              <legend className="fp-label">Specialties</legend>
              <div className="onboarding-equipment">
                {choices.map((value) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={form.specialties.includes(value)}
                      onChange={() =>
                        field(
                          "specialties",
                          form.specialties.includes(value)
                            ? form.specialties.filter((item) => item !== value)
                            : [...form.specialties, value],
                        )
                      }
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-grid mt-5">
              <label>
                Location
                <input
                  className="fp-input"
                  value={form.location}
                  maxLength={100}
                  onChange={(e) => field("location", e.target.value)}
                />
              </label>
              <label>
                Years of experience
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  max={60}
                  value={form.experienceYears}
                  onChange={(e) => field("experienceYears", e.target.value)}
                />
              </label>
            </div>
            <label className="fp-label mt-5" htmlFor="coach-languages">
              Languages <span className="font-normal">(comma separated)</span>
            </label>
            <input
              id="coach-languages"
              className="fp-input"
              value={form.languages}
              onChange={(e) => field("languages", e.target.value)}
            />
            {[
              ["remoteAvailable", "Offer online coaching"],
              ["acceptingAthletes", "Accepting new athletes"],
              ["isPublic", "Publish my profile in Find a coach"],
            ].map(([key, label]) => (
              <label className="athlete-choice mt-3" key={key}>
                <input
                  type="checkbox"
                  checked={!!form[key as keyof typeof form]}
                  onChange={(e) => field(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
            {error && (
              <p className="form-feedback" role="alert">
                {error}
              </p>
            )}
            {saved && (
              <p className="assignment-success" role="status">
                <Check size={17} />
                Your public profile was saved.
              </p>
            )}
            <button
              className="primary-action mt-5"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving profile…" : "Save profile"}
            </button>
          </form>
          <div className="page-stack">
            <section className="page-section">
              <h2>Turn interest into a coaching relationship.</h2>
              <ol className="coach-start-steps">
                <li>Publish your public profile.</li>
                <li>
                  Create a coaching package and submit it for admin review.
                </li>
                <li>Accept an athlete’s request and agree the scope.</li>
                <li>After verified payment, they appear in your roster.</li>
              </ol>
              <Link className="secondary-action mt-5" to="/marketplace/manage">
                Manage your packages
                <ArrowUpRight size={16} />
              </Link>
            </section>
            <section className="page-section">
              <h2>Already working together?</h2>
              <p>
                Invite an existing athlete account directly. They choose whether
                to accept and what detailed records to share.
              </p>
              <Link className="secondary-action mt-5" to="/coach?invite=1">
                Invite an athlete
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
