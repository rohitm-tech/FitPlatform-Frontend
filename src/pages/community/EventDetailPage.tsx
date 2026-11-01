import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { rupees, when } from "./format";
import type { PlatformEvent } from "./types";

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
          <h1>{data.title}</h1>
          <p>{data.place}</p>
          <p>{data.summary}</p>
          <p>
            <time dateTime={data.startsAt}>{when(data.startsAt)}</time>
            {" to "}
            <time dateTime={data.endsAt}>{when(data.endsAt)}</time>
          </p>
          <p>{places === 0 ? "Full" : `${places} of ${data.capacity} places left`}</p>
          <div className="price-pair">
            <span>
              Premium <strong>{rupees(data.premiumPriceMinor)}</strong>
            </span>
            <span>
              Full <strong>{rupees(data.fullPriceMinor)}</strong>
            </span>
            <span>
              Your price <strong>{rupees(data.yourPriceMinor)}</strong>
            </span>
          </div>
          <p>{note(data)}</p>
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
          {going && <p>You're going. {rupees(data.rsvp?.priceMinor || 0)} is recorded on this signup.</p>}
        </article>
      )}
    </div>
  );
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
