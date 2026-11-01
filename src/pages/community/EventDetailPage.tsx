import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { rupees, when } from "./format";
import type { PlatformEvent } from "./types";
import "./community.css";

function failure(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || fallback;
  return fallback;
}

export default function EventDetailPage() {
  const { eventId = "" } = useParams();
  const cache = useQueryClient();
  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => (await api.get(`/events/${eventId}`)).data.data as PlatformEvent,
    enabled: Boolean(eventId),
  });
  const book = useMutation({
    mutationFn: async () => (await api.post(`/events/${eventId}/rsvp`)).data.data as PlatformEvent,
    onSuccess: async () => {
      toast.success("You're booked. The price is recorded, and nothing is charged.");
      await cache.invalidateQueries({ queryKey: ["event", eventId] });
      await cache.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => toast.error(failure(error, "Could not book this event")),
  });
  const cancel = useMutation({
    mutationFn: async () => (await api.delete(`/events/${eventId}/rsvp`)).data.data as PlatformEvent,
    onSuccess: async () => {
      toast.success("Signup cancelled");
      await cache.invalidateQueries({ queryKey: ["event", eventId] });
      await cache.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => toast.error(failure(error, "Could not cancel this signup")),
  });
  const data = event.data;
  const places = data ? Math.max(0, data.capacity - data.goingCount) : 0;
  const going = data?.rsvp?.status === "going";

  return (
    <div className="product-page">
      <Link className="page-back" to="/events">
        All events
      </Link>
      {event.isLoading && <p className="page-state">Loading this event…</p>}
      {event.isError && (
        <div className="page-state page-state-error">
          <h2>This event could not be loaded</h2>
          <button type="button" onClick={() => event.refetch()}>
            Retry
          </button>
        </div>
      )}
      {data && (
        <article className="event-detail">
          {data.images && data.images.length > 0 && (
            <figure className="event-photo">
              <img src={data.images[0].url} alt="" style={{ objectPosition: photoFocus(data.title) }} />
              {data.images[0].credit && <figcaption>{data.images[0].credit}</figcaption>}
              {data.images.length > 1 && (
                <div className="event-gallery">
                  {data.images.slice(1).map((image) => (
                    <img key={image.url} src={image.url} alt="" />
                  ))}
                </div>
              )}
            </figure>
          )}
          <div className="event-story">
            <h1>{data.title}</h1>
            <p className="event-place">{data.place}</p>
            <p>
              <time dateTime={data.startsAt}>{when(data.startsAt)}</time>
              {" to "}
              <time dateTime={data.endsAt}>{when(data.endsAt)}</time>
            </p>
            <p className="event-summary">{data.summary}</p>
            <p>{places === 0 ? "This event is full." : `${places} ${places === 1 ? "place" : "places"} left of ${data.capacity}.`}</p>
          </div>
          <aside className="booking-panel">
            <p className="booking-price">{rupees(data.yourPriceMinor)}</p>
            {data.yourPriceMinor < data.fullPriceMinor && (
              <p>Full price {rupees(data.fullPriceMinor)}</p>
            )}
            <p className={`event-status is-${data.rsvp?.status === "going" ? "going" : data.access === "early" ? "early" : data.access === "closed" ? "closed" : "open"}`}>
              {note(data)}
            </p>
            {going ? (
              <button
                className="secondary-action"
                type="button"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel signup"}
              </button>
            ) : (
              <button
                className="primary-action"
                type="button"
                disabled={!data.canRsvp || book.isPending}
                onClick={() => book.mutate()}
              >
                {book.isPending ? "Booking…" : `Book at ${rupees(data.yourPriceMinor)}`}
              </button>
            )}
          </aside>
        </article>
      )}
    </div>
  );
}

function photoFocus(title: string) {
  if (title.startsWith("Lalbagh")) return "center bottom";
  if (title.startsWith("Cubbon")) return "center 62%";
  if (title.startsWith("Ulsoor")) return "center 58%";
  if (title.startsWith("Indiranagar")) return "center 22%";
  return "center";
}

function note(event: PlatformEvent) {
  if (event.rsvp?.status === "going") {
    return `You're booked at ${rupees(event.rsvp.priceMinor)}. Nothing is charged.`;
  }
  if (event.access === "closed") return "Signup is closed because this event has already started.";
  if (event.goingCount >= event.capacity) return "This event is full.";
  if (event.access === "early" && event.canRsvp) {
    return `Early access is open until ${when(event.publicOpensAt)}. Your price stays ${rupees(event.yourPriceMinor)} after that.`;
  }
  if (event.access === "early") {
    return `Premium members can book until ${when(event.publicOpensAt)}. After that, your price is ${rupees(event.fullPriceMinor)}.`;
  }
  if (event.yourPriceMinor < event.fullPriceMinor) {
    return `Booking is open to everyone. Your Premium price is ${rupees(event.yourPriceMinor)}.`;
  }
  return "Booking is open. Your price is the full price.";
}
