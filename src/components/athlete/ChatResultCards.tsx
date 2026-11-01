import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Check, MapPin, Wifi } from "lucide-react";
import { money } from "../../pages/marketplace/marketplaceShared";
import { KINDS, priceUnitLabel } from "../../pages/discover/catalog";
import "../../chat-cards.css";

export type ExerciseCard = {
  type?: "exercise";
  exerciseId: string;
  name: string;
  slug: string;
  difficulty?: string;
  equipment?: string[];
  primaryMuscle?: string | null;
};

export type CoachCard = {
  type: "coach";
  coachId: string;
  name: string;
  sport: string;
  sports?: string[];
  headline?: string;
  summary?: string;
  area?: string;
  city?: string;
  distanceKm?: number | null;
  delivery?: "in_person" | "online";
  experienceYears?: number | null;
  priceMinor?: number | null;
  priceUnit?: string;
  remote?: boolean;
  accepting?: boolean;
  languages?: string[];
  reasons?: string[];
  cautions?: string[];
  matchScore?: number;
  isDemo?: boolean;
};

export type PlaceCard = {
  type: "place";
  placeId: string;
  name: string;
  kind: string;
  sport: string;
  area?: string;
  city?: string;
  distanceKm?: number | null;
  priceMinor?: number | null;
  priceUnit?: string;
  hours?: string;
  summary?: string;
  isDemo?: boolean;
};

export type LifeCard = {
  type: "life";
  name: string;
  headline?: string;
  summary?: string;
  href?: string;
};

export type ChatCard = ExerciseCard | CoachCard | PlaceCard | LifeCard;

function lifeLogHref(href?: string) {
  if (href && href.startsWith("/") && !href.startsWith("//")) return href;
  return "/athlete/recovery";
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function CoachMatchCard({ card, top }: { card: CoachCard; top: boolean }) {
  const online = card.delivery === "online";
  const facts = [
    online
      ? card.distanceKm != null && card.distanceKm <= 100
        ? `Online · ${card.distanceKm.toFixed(1)} km away`
        : card.city
          ? `Online · based in ${card.city}`
          : "Online"
      : card.distanceKm != null
        ? `${card.distanceKm.toFixed(1)} km away`
        : card.city,
    card.experienceYears ? `${card.experienceYears} yrs coaching` : "",
    card.priceMinor != null
      ? `From ${money(card.priceMinor)}${card.priceUnit === "month" ? "/month" : ""}`
      : "Rate not listed",
    card.languages?.length ? card.languages.slice(0, 3).join(", ") : "",
  ].filter(Boolean);

  return (
    <article className="coach-match" aria-label={`${card.name}, ${card.sport} coach`}>
      <header className="coach-match-head">
        <span className="coach-match-avatar" aria-hidden="true">
          {initials(card.name)}
        </span>
        <div className="coach-match-title">
          <strong>{card.name}</strong>
          <span>
            {card.sport} coach{card.area ? ` · ${card.area}` : ""}
          </span>
        </div>
        {top && <span className="coach-match-badge">Best fit</span>}
      </header>
      {card.headline && <p className="coach-match-headline">{card.headline}</p>}
      {card.summary && <p className="coach-match-summary">{card.summary}</p>}
      <ul className="coach-match-facts" aria-label="Key facts">
        {facts.map((fact, index) => (
          <li key={fact}>
            {index === 0 &&
              (online ? <Wifi size={13} aria-hidden="true" /> : <MapPin size={13} aria-hidden="true" />)}
            {fact}
          </li>
        ))}
      </ul>
      {(card.reasons?.length || card.cautions?.length) ? (
        <div className="coach-match-why">
          <span className="coach-match-why-label">Why this coach</span>
          <ul>
            {card.reasons?.map((reason) => (
              <li key={reason}>
                <Check size={14} aria-hidden="true" />
                {reason}
              </li>
            ))}
            {card.cautions?.map((caution) => (
              <li key={caution} className="is-caution">
                <AlertTriangle size={14} aria-hidden="true" />
                {caution}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <footer className="coach-match-foot">
        <Link className="coach-match-link" to={`/coaches/${card.coachId}`}>
          View profile and packages
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        {card.isDemo && <span className="coach-match-demo">Demo profile</span>}
      </footer>
    </article>
  );
}

function PlaceMatchCard({ card }: { card: PlaceCard }) {
  const kind = KINDS.find(([id]) => id === card.kind)?.[1] ?? card.kind;
  const price =
    card.priceMinor == null
      ? ""
      : card.priceMinor === 0
        ? "Free"
        : `${money(card.priceMinor)} ${priceUnitLabel(card.priceUnit || "")}`.trim();
  return (
    <Link className="place-match" to={`/places/${card.placeId}`}>
      <strong>{card.name}</strong>
      <span className="place-match-meta">
        {[card.sport, kind, card.area].filter(Boolean).join(" · ")}
      </span>
      <span className="place-match-facts">
        {[card.distanceKm != null ? `${card.distanceKm.toFixed(1)} km` : "", price, card.hours]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </Link>
  );
}

export default function ChatResultCards({ cards }: { cards: ChatCard[] }) {
  const coaches = cards.filter((card): card is CoachCard => card.type === "coach");
  const places = cards.filter((card): card is PlaceCard => card.type === "place");
  const life = cards.filter((card): card is LifeCard => card.type === "life");
  const exercises = cards.filter(
    (card): card is ExerciseCard => !card.type || card.type === "exercise",
  );
  return (
    <>
      {coaches.length > 0 && (
        <div className="coach-matches">
          {coaches.map((card, index) => (
            <CoachMatchCard key={card.coachId} card={card} top={index === 0 && coaches.length > 1} />
          ))}
        </div>
      )}
      {places.length > 0 && (
        <div className="place-matches">
          {places.map((card) => (
            <PlaceMatchCard key={card.placeId} card={card} />
          ))}
        </div>
      )}
      {life.length > 0 &&
        life.map((card) => (
          <Link key={card.name} className="life-log-card" to={lifeLogHref(card.href)}>
            <span className="life-log-kicker">Your log</span>
            <strong>{card.name}</strong>
            {card.headline && <span>{card.headline}</span>}
            {card.summary && <span className="life-log-summary">{card.summary}</span>}
            <span className="life-log-open">Open your log</span>
          </Link>
        ))}
      {exercises.length > 0 && (
        <div className="chat-exercise-cards">
          {exercises.map((card) => (
            <Link key={card.exerciseId} to={`/exercises/${card.slug}`} className="chat-exercise-card">
              <strong>{card.name}</strong>
              <span className="chat-exercise-meta">
                {[card.primaryMuscle, card.difficulty, card.equipment?.[0]].filter(Boolean).join(" · ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
