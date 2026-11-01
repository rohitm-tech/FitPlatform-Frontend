import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "../../services/api";
import { eventStamp, rupees, when } from "./format";
import type { PlatformEvent } from "./types";
import "./community.css";

type EventFilter = "all" | "upcoming" | "earlier" | "going" | "early" | "open";

const FILTERS: [EventFilter, string][] = [
  ["all", "All"],
  ["upcoming", "Coming up"],
  ["earlier", "Earlier"],
  ["going", "You're going"],
  ["early", "Early access"],
  ["open", "Open"],
];

function matches(event: PlatformEvent, filter: EventFilter, query: string) {
  const haystack = `${event.title} ${event.place} ${event.summary}`.toLowerCase();
  if (query && !haystack.includes(query.trim().toLowerCase())) return false;
  const past = new Date(event.startsAt).getTime() < Date.now();
  if (filter === "upcoming") return !past;
  if (filter === "earlier") return past;
  if (filter === "going") return event.rsvp?.status === "going";
  if (filter === "early") return event.access === "early";
  if (filter === "open") return event.access === "open";
  return true;
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");
  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events")).data.data as PlatformEvent[],
  });
  const now = Date.now();
  const visible = events.data?.filter((event) => matches(event, filter, query)) ?? [];
  const upcoming = visible.filter((event) => new Date(event.startsAt).getTime() >= now);
  const earlier = visible.filter((event) => new Date(event.startsAt).getTime() < now);
  const showUpcoming = filter !== "earlier";
  const showEarlier = filter !== "upcoming";

  return (
    <div className="product-page events-page">
      <h1>Events</h1>
      <div className="event-tools">
        <label className="explore-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search events"
            value={query}
            placeholder="Search by name or place"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="choice-row" role="group" aria-label="Filter events">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {events.isLoading && <p className="page-state">Loading events…</p>}
      {events.isError && (
        <div className="page-state page-state-error">
          <h2>Events could not be loaded</h2>
          <button type="button" onClick={() => events.refetch()}>
            Retry
          </button>
        </div>
      )}
      {events.data && events.data.length === 0 && (
        <div className="page-state">
          <h2>No events yet</h2>
          <p>When the platform publishes an event, it will show up here.</p>
        </div>
      )}
      {events.data && events.data.length > 0 && visible.length === 0 && (
        <div className="page-state">
          <h2>Nothing matches</h2>
          <p>Try another name, place, or filter.</p>
        </div>
      )}
      {showUpcoming && upcoming.length > 0 && (
        <section className="event-group">
          <h2>Coming up</h2>
          <div className="event-list">
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}
      {showEarlier && earlier.length > 0 && (
        <section className="event-group">
          <h2>Earlier</h2>
          <div className="event-list">
            {earlier.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventCard({ event }: { event: PlatformEvent }) {
  const places = Math.max(0, event.capacity - event.goingCount);
  const stamp = eventStamp(event.startsAt);
  const past = new Date(event.startsAt).getTime() < Date.now();
  const tone = statusTone(event);
  return (
    <Link
      className={`event-row${past ? " is-past" : ""}`}
      to={`/events/${event._id}`}
    >
      <time className="event-stamp" dateTime={event.startsAt}>
        <span>{stamp.day}</span>
        <small>{stamp.month}</small>
      </time>
      <div className="event-copy">
        <h3>{event.title}</h3>
        <p>
          {stamp.weekday}, {event.place}
        </p>
        <p>{places === 0 ? "Full" : `${places} ${places === 1 ? "place" : "places"} left`}</p>
        <p className={`event-status is-${tone}`}>{accessLabel(event)}</p>
      </div>
      <div className="event-price">
        <strong>{rupees(event.yourPriceMinor)}</strong>
        {event.yourPriceMinor < event.fullPriceMinor && (
          <span>Full {rupees(event.fullPriceMinor)}</span>
        )}
      </div>
    </Link>
  );
}

function statusTone(event: PlatformEvent) {
  if (event.rsvp?.status === "going") return "going";
  if (event.access === "closed" || event.goingCount >= event.capacity) return "closed";
  if (event.access === "early") return "early";
  return "open";
}

function accessLabel(event: PlatformEvent) {
  if (event.rsvp?.status === "going") return "You're going";
  if (event.access === "closed") return "Signup is closed";
  if (event.goingCount >= event.capacity) return "This event is full";
  if (event.access === "early" && event.canRsvp) {
    return `Early access until ${when(event.publicOpensAt)}`;
  }
  if (event.access === "early") {
    return `Premium is booking now. Opens to everyone on ${when(event.publicOpensAt)}`;
  }
  return "Open to every athlete";
}
