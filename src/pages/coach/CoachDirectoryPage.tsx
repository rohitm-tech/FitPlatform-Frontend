import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, MapPin, Globe } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { money } from "../marketplace/marketplaceShared";
import "../../coaches.css";
export default function CoachDirectoryPage() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setQ(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["coach-directory", q, specialty, available],
    queryFn: async () =>
      (await api.get("/coaches", { params: { q, specialty, available } })).data
        .data,
  });
  return (
    <div className="product-page coach-directory-page">
      <div className="page-greeting">
        <div>
          <h1>Find your coach.</h1>
          <p>
            A human who understands your goals, your training and your next
            step.
          </p>
        </div>
        {hasRole("coach") && (
          <div className="header-actions">
            <Link className="secondary-action" to="/coach?invite=1">
              Invite an athlete
            </Link>
            <Link className="secondary-action" to="/coach/profile">
              Your public profile
            </Link>
          </div>
        )}
      </div>
      <div className="coach-directory-intro">
        <h2>
          Better together.
          <br />
          Built around you.
        </h2>
        <p>
          Explore a coach’s approach and packages. Send a request, agree the
          scope, then pay after they accept.
        </p>
      </div>
      <div className="coach-directory-filters">
        <label>
          <Search size={17} />
          <input
            type="search"
            aria-label="Search coaches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, goal or location"
          />
        </label>
        <label className="sr-only" htmlFor="coach-specialty">
          Coaching specialty
        </label>
        <select
          id="coach-specialty"
          className="fp-input"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">All specialties</option>
          {[
            "Strength",
            "Weight management",
            "Running",
            "Hybrid",
            "Mobility",
            "General fitness",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <label className="coach-available-toggle">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Accepting athletes
        </label>
      </div>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Finding coaches…
        </div>
      ) : query.isError ? (
        <div className="page-state">
          <h2>Coaches couldn’t be loaded.</h2>
          <button onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : query.data?.length ? (
        <div className="coach-directory-grid">
          {query.data.map((profile: any) => {
            const price = profile.packages
              ?.slice()
              .sort((a: any, b: any) => a.priceMinor - b.priceMinor)[0];
            return (
              <article key={profile._id} className="coach-directory-card">
                <div className="coach-card-identity">
                  <span className="coach-portrait-initials">
                    {profile.coachId.name
                      .split(" ")
                      .map((part: string) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <h2>{profile.coachId.name}</h2>
                    <p>
                      {profile.acceptingAthletes
                        ? "Accepting athletes"
                        : "Not currently accepting athletes"}
                      {profile.isDemo ? " · Demo profile" : ""}
                    </p>
                  </div>
                </div>
                <h3>{profile.headline}</h3>
                <div className="coach-specialties">
                  {profile.specialties.map((value: string) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>
                <div className="coach-card-location">
                  {profile.location && (
                    <span>
                      <MapPin size={14} />
                      {profile.location}
                    </span>
                  )}
                  {profile.remoteAvailable && (
                    <span>
                      <Globe size={14} />
                      Online coaching
                    </span>
                  )}
                </div>
                <div className="coach-card-bottom">
                  <div>
                    {price ? (
                      <>
                        <strong>
                          From {money(price.priceMinor, price.currency)}
                        </strong>
                        <span>
                          {price.billing === "month"
                            ? "per month"
                            : "per package"}
                        </span>
                      </>
                    ) : (
                      <span>Packages to be confirmed</span>
                    )}
                  </div>
                  <Link
                    className="secondary-action"
                    to={`/coaches/${profile.coachId._id}`}
                  >
                    View profile
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="page-state">
          <h2>No coaches match just yet.</h2>
          <p>Try another specialty or location.</p>
          <button
            onClick={() => {
              setSearch("");
              setSpecialty("");
              setAvailable(false);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <p className="section-note mt-6">
        Only public profiles from approved coach accounts appear here. Demo
        profiles are marked. A request does not share detailed training records.
      </p>
    </div>
  );
}
