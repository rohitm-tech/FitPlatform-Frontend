import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { api } from "../../services/api";
import { rupees, when } from "../community/format";

type AdminEvent = {
  _id: string;
  title: string;
  summary: string;
  place: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  fullPriceMinor: number;
  premiumPriceMinor: number;
  publicOpensAt: string;
  status: "draft" | "published" | "cancelled";
  goingCount: number;
};

type Rsvp = {
  _id: string;
  priceMinor: number;
  planAtSignup: "free" | "premium";
  athlete: { _id: string; name: string };
};

type Draft = {
  title: string;
  summary: string;
  place: string;
  startsAt: string;
  endsAt: string;
  publicOpensAt: string;
  capacity: string;
  fullRupees: string;
  premiumRupees: string;
  status: AdminEvent["status"];
};

const empty: Draft = {
  title: "",
  summary: "",
  place: "",
  startsAt: "",
  endsAt: "",
  publicOpensAt: "",
  capacity: "20",
  fullRupees: "",
  premiumRupees: "",
  status: "published",
};

const pad = (value: number) => String(value).padStart(2, "0");

function toLocalInput(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromEvent(event: AdminEvent): Draft {
  return {
    title: event.title,
    summary: event.summary,
    place: event.place,
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    publicOpensAt: toLocalInput(event.publicOpensAt),
    capacity: String(event.capacity),
    fullRupees: String(Math.round(event.fullPriceMinor / 100)),
    premiumRupees: String(Math.round(event.premiumPriceMinor / 100)),
    status: event.status,
  };
}

function failure(error: unknown) {
  if (!axios.isAxiosError(error)) return "The event could not be saved.";
  const errors = error.response?.data?.errors;
  if (Array.isArray(errors) && errors.length) return errors.join(" ");
  return error.response?.data?.message || "The event could not be saved.";
}

export default function EventsDesk() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editing, setEditing] = useState("");
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<{ mimeType: string; data: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const result = await api.get("/events/admin");
      setEvents(result.data.data);
    } catch {
      setError("Events could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const loadRsvps = async (eventId: string) => {
    try {
      const result = await api.get(`/events/admin/${eventId}/rsvps`);
      setRsvps(result.data.data);
    } catch {
      setRsvps([]);
      toast.error("Signups could not be loaded");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const edit = (event: AdminEvent) => {
    setEditing(event._id);
    setDraft(fromEvent(event));
    setPhotos([]);
    loadRsvps(event._id);
  };

  async function addPhotos(list: FileList | null) {
    if (!list) return;
    const next = [...photos];
    for (const file of Array.from(list)) {
      if (next.length >= 4) break;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) continue;
      if (file.size > 4 * 1024 * 1024) {
        setError("Each photo must be 4 MB or smaller.");
        continue;
      }
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      next.push({ mimeType: file.type, data, preview: `data:${file.type};base64,${data}` });
    }
    setPhotos(next);
  }

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const full = Math.round(Number(draft.fullRupees) * 100);
    const premium = Math.round(Number(draft.premiumRupees) * 100);
    const opens = new Date(draft.publicOpensAt).getTime();
    const starts = new Date(draft.startsAt).getTime();
    const ends = new Date(draft.endsAt).getTime();
    if (!draft.title.trim() || !draft.summary.trim() || !draft.place.trim()) {
      setError("Add a title, summary, and place.");
      return;
    }
    if (!Number.isFinite(full) || !Number.isFinite(premium) || full < 0 || premium < 0) {
      setError("Enter both prices in rupees.");
      return;
    }
    if (!Number.isInteger(Number(draft.capacity)) || Number(draft.capacity) < 1) {
      setError("Capacity needs to be at least 1.");
      return;
    }
    if ([opens, starts, ends].some((time) => Number.isNaN(time))) {
      setError("Enter a valid date.");
      return;
    }
    if (premium > full) {
      setError("The premium price cannot be higher than the full price.");
      return;
    }
    if (opens >= starts) {
      setError("Booking must open before the event starts.");
      return;
    }
    if (ends <= starts) {
      setError("The event must end after it starts.");
      return;
    }
    setBusy(true);
    setError("");
    const body = {
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      place: draft.place.trim(),
      startsAt: new Date(draft.startsAt).toISOString(),
      endsAt: new Date(draft.endsAt).toISOString(),
      publicOpensAt: new Date(draft.publicOpensAt).toISOString(),
      capacity: Number(draft.capacity),
      fullPriceMinor: full,
      premiumPriceMinor: premium,
      status: draft.status,
      ...(photos.length
        ? { photos: photos.map(({ mimeType, data }) => ({ mimeType, data })) }
        : {}),
    };
    try {
      if (editing) {
        await api.patch(`/events/admin/${editing}`, body);
        toast.success("Event updated");
        setPhotos([]);
      } else {
        const created = await api.post("/events/admin", body);
        setEditing(created.data.data._id);
        setPhotos([]);
        toast.success("Event created");
      }
      await load();
      if (editing) await loadRsvps(editing);
    } catch (saveError) {
      setError(failure(saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="events-desk">
      <h2>Events</h2>
      <p>
        Premium athletes can book before the public open time, and their signup records the lower
        price. After that, every athlete can book at the full price. Nothing is charged.
      </p>
      {loading && <p className="page-state">Loading events…</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <form className="event-form" onSubmit={save}>
        <label className="span-2">
          Title
          <input
            className="fp-input"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>
        <label className="span-2">
          Summary
          <textarea
            value={draft.summary}
            onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
          />
        </label>
        <label className="span-2">
          Photos
          <input
            className="fp-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              void addPhotos(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {photos.length > 0 && (
          <div className="span-2 event-photo-picks">
            {photos.map((photo) => (
              <img key={photo.preview.slice(0, 48)} src={photo.preview} alt="" />
            ))}
          </div>
        )}
        <label className="span-2">
          Place
          <input
            className="fp-input"
            value={draft.place}
            onChange={(event) => setDraft({ ...draft, place: event.target.value })}
          />
        </label>
        <label>
          Starts
          <input
            className="fp-input"
            type="datetime-local"
            value={draft.startsAt}
            onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
          />
        </label>
        <label>
          Ends
          <input
            className="fp-input"
            type="datetime-local"
            value={draft.endsAt}
            onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
          />
        </label>
        <label>
          Booking opens to everyone
          <input
            className="fp-input"
            type="datetime-local"
            value={draft.publicOpensAt}
            onChange={(event) => setDraft({ ...draft, publicOpensAt: event.target.value })}
          />
        </label>
        <label>
          Capacity
          <input
            className="fp-input"
            type="number"
            min={1}
            value={draft.capacity}
            onChange={(event) => setDraft({ ...draft, capacity: event.target.value })}
          />
        </label>
        <label>
          Full price (₹)
          <input
            className="fp-input"
            type="number"
            min={0}
            value={draft.fullRupees}
            onChange={(event) => setDraft({ ...draft, fullRupees: event.target.value })}
          />
        </label>
        <label>
          Premium price (₹)
          <input
            className="fp-input"
            type="number"
            min={0}
            value={draft.premiumRupees}
            onChange={(event) => setDraft({ ...draft, premiumRupees: event.target.value })}
          />
        </label>
        <label>
          Status
          <select
            className="fp-input"
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as Draft["status"] })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <div className="span-2 event-form-actions">
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Update event" : "Create event"}
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              setEditing("");
              setDraft(empty);
              setRsvps([]);
              setError("");
            }}
          >
            New event
          </button>
        </div>
      </form>
      <ul className="admin-event-list">
        {events.map((event) => (
          <li key={event._id}>
            <div>
              <strong>{event.title}</strong>
              <span>
                {event.status} · {when(event.startsAt)} · {event.goingCount} going · Premium{" "}
                {rupees(event.premiumPriceMinor)} · Full {rupees(event.fullPriceMinor)}
              </span>
            </div>
            <button className="secondary-action" type="button" onClick={() => edit(event)}>
              Edit
            </button>
          </li>
        ))}
      </ul>
      {editing && (
        <div className="page-section">
          <h3>Who is going</h3>
          {rsvps.length === 0 ? (
            <p>No signups yet.</p>
          ) : (
            <ul className="rsvp-list">
              {rsvps.map((row) => (
                <li key={row._id}>
                  <strong>{row.athlete.name}</strong>
                  <span>
                    {row.planAtSignup === "premium" ? "Premium" : "Free"} · {rupees(row.priceMinor)} recorded
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
