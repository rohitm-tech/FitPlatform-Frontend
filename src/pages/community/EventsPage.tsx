import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { rupees, when } from "./format";
import type { PlatformEvent } from "./types";

export default function EventsPage() {
  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events")).data.data as PlatformEvent[],
  });
  const now = Date.now();
  const upcoming = events.data?.filter((event) => new Date(event.startsAt).getTime() >= now) ?? [];
  const earlier = events.data?.filter((event) => new Date(event.startsAt).getTime() < now) ?? [];

  return (
    <div className="product-page">
      <h1>Events</h1>
      <p>
        Premium athletes can book during early access and keep the lower price. After booking opens,
        every athlete can join at the full price. Signup records the price. Nothing is charged here.
      </p>
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
      {upcoming.length > 0 && (
        <section className="event-group">
          <h2>Coming up</h2>
          <div className="event-list">
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}
      {earlier.length > 0 && (
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
  return (
    <article className="event-card">
      <header>
        <h3>
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p>{event.place}</p>
      </header>
      <p>{event.summary}</p>
      <p>
        <time dateTime={event.startsAt}>{when(event.startsAt)}</time>
        {" · "}
        {places === 0 ? "Full" : `${places} ${places === 1 ? "place" : "places"} left`}
      </p>
      <div className="price-pair">
        <span>
          Premium <strong>{rupees(event.premiumPriceMinor)}</strong>
        </span>
        <span>
          Full <strong>{rupees(event.fullPriceMinor)}</strong>
        </span>
        <span>
          Your price <strong>{rupees(event.yourPriceMinor)}</strong>
        </span>
      </div>
      <p className="event-access">{accessLabel(event)}</p>
    </article>
  );
}

function accessLabel(event: PlatformEvent) {
  if (event.rsvp?.status === "going") return `You're going · ${rupees(event.rsvp.priceMinor)} recorded`;
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
