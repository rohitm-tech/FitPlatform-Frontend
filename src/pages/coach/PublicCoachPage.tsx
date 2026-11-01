import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Globe } from "lucide-react";
import { api } from "../../services/api";
import { ListingCard } from "../marketplace/marketplaceShared";
import { ReachMap } from "../../components/discover/ReachMap";
import { CoachChatOffer } from "../../components/coach/CoachChatOffer";
import "../../coaches.css";
import "../../marketplace.css";
export default function PublicCoachPage() {
  const { coachId } = useParams();
  const query = useQuery({
    queryKey: ["public-coach", coachId],
    queryFn: async () => (await api.get(`/coaches/${coachId}`)).data.data,
  });
  const profile = query.data;
  return (
    <div className="product-page coach-directory-page">
      <Link className="page-back" to="/coaches">
        <ArrowLeft size={16} />
        Near you
      </Link>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading coach profile…
        </div>
      ) : query.isError || !profile ? (
        <div className="page-state">
          <h1>This profile is unavailable.</h1>
          <p>The coach may have made their profile private.</p>
          <Link to="/coaches">Find another coach</Link>
        </div>
      ) : (
        <>
          <div className="coach-public-hero">
            <span className="coach-portrait-initials">
              {profile.coachId.name
                .split(" ")
                .map((part: string) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <h1>{profile.coachId.name}</h1>
              <h2>{profile.headline}</h2>
              <p>
                {profile.acceptingAthletes
                  ? "Accepting athletes"
                  : "Not currently accepting athletes"}
                {profile.isDemo ? " · Demo profile" : ""}
              </p>
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
            </div>
          </div>
          {coachId && <CoachChatOffer coachId={coachId} coachName={profile.coachId.name} />}
          {profile.point?.coordinates?.length === 2 && (
            <section className="near-base">
              <h2>Coaching base</h2>
              <div className="near-map-wrap near-map-short">
                <ReachMap
                  center={{
                    lat: profile.point.coordinates[1],
                    lng: profile.point.coordinates[0],
                  }}
                  pins={[
                    {
                      id: "base",
                      lat: profile.point.coordinates[1],
                      lng: profile.point.coordinates[0],
                      label: profile.location || profile.coachId.name,
                    },
                  ]}
                  selectedId="base"
                />
              </div>
            </section>
          )}
          <div className="two-column-page">
            <section className="page-section">
              <h2>A little about my approach</h2>
              <p className="coach-bio">{profile.bio}</p>
              <div className="coach-specialties">
                {profile.specialties.map((value: string) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </section>
            <section className="page-section">
              <h2>Training together</h2>
              <dl className="coach-profile-details">
                {profile.experienceYears != null && (
                  <div>
                    <dt>Experience shared by coach</dt>
                    <dd>{profile.experienceYears} years</dd>
                  </div>
                )}
                <div>
                  <dt>Languages</dt>
                  <dd>{profile.languages.join(", ") || "Ask the coach"}</dd>
                </div>
                <div>
                  <dt>How it starts</dt>
                  <dd>
                    Choose a coaching package. The coach accepts your request
                    before payment.
                  </dd>
                </div>
                <div>
                  <dt>Your records</dt>
                  <dd>
                    Summary access starts after a paid coaching package is
                    confirmed. Detailed records stay under your sharing
                    controls.
                  </dd>
                </div>
              </dl>
            </section>
          </div>
          <section className="mt-8">
            {profile.packages.length ? (
              <div className="marketplace-grid">
                {profile.packages.map((listing: any) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    saved={false}
                  />
                ))}
              </div>
            ) : (
              <div className="page-state">
                <h2>No public packages yet.</h2>
                <p>
                  This coach hasn’t published an offering. Existing clients can
                  join through a direct coach invitation.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
