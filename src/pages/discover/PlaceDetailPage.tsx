import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { money } from "../marketplace/marketplaceShared";
import { ReachMap } from "../../components/discover/ReachMap";
import { priceUnitLabel } from "./catalog";

type Place = {
  _id: string;
  name: string;
  kind: string;
  sport: string;
  area: string;
  address: string;
  city: string;
  hours: string;
  surface: string;
  notes: string;
  priceMinor: number;
  priceUnit: string;
  isDemo: boolean;
  lat: number;
  lng: number;
};

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function PlaceDetailPage() {
  const { placeId } = useParams();
  const { isAuthenticated } = useAuth();
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("07:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const query = useQuery({
    queryKey: ["place", placeId],
    queryFn: async () => (await api.get(`/places/${placeId}`)).data.data as Place,
  });
  const place = query.data;
  const free = place?.priceMinor === 0;

  return (
    <div className="product-page near-page">
      <Link className="page-back" to="/coaches">
        <ArrowLeft size={16} />
        Near you
      </Link>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading this place…
        </div>
      ) : query.isError || !place ? (
        <div className="page-state">
          <h1>This place is unavailable.</h1>
          <p>It may have been removed from the catalogue.</p>
          <Link to="/coaches">Back to Near you</Link>
        </div>
      ) : (
        <>
          <header className="near-object">
            <div>
              <h1>{place.name}</h1>
              <p className="near-meta">
                {place.area}, {place.city} · {place.sport}
                {place.isDemo ? " · Demo catalogue" : ""}
              </p>
            </div>
            <p className={free ? "near-price is-zero" : "near-price"}>
              <strong>{money(place.priceMinor)}</strong>
              <span>{priceUnitLabel(free ? "none" : place.priceUnit)}</span>
            </p>
          </header>
          <div className="near-detail">
            <section>
              <h2>The slot</h2>
              <dl className="near-facts">
                <div>
                  <dt>Address</dt>
                  <dd>{place.address}</dd>
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>{place.hours || "—"}</dd>
                </div>
                <div>
                  <dt>Surface</dt>
                  <dd>{place.surface || "—"}</dd>
                </div>
                <div>
                  <dt>Rate</dt>
                  <dd>
                    {money(place.priceMinor)}{" "}
                    {priceUnitLabel(free ? "none" : place.priceUnit)}
                  </dd>
                </div>
              </dl>
              <p className="near-note">{place.notes}</p>
              {saved ? (
                <p className="near-empty" role="status">
                  Request saved for {saved}. {place.name} still has to confirm
                  the slot. This demo does not take payment.
                </p>
              ) : isAuthenticated ? (
                <form
                  className="near-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setError("");
                    if (!date || !startTime) {
                      setError("Choose a date and a start time.");
                      return;
                    }
                    setBusy(true);
                    try {
                      await api.post(`/places/${place._id}/enquiries`, {
                        date,
                        startTime,
                        note,
                      });
                      setSaved(
                        `${date} at ${startTime}`,
                      );
                    } catch (caught: any) {
                      setError(
                        caught.response?.data?.errors?.[0] ||
                          caught.response?.data?.message ||
                          "The request was not saved. Your details are still here.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Date
                    <input
                      className="fp-input"
                      type="date"
                      required
                      min={today()}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                  <label>
                    Start time
                    <input
                      className="fp-input"
                      type="time"
                      required
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </label>
                  <label>
                    Note
                    <textarea
                      className="fp-input"
                      rows={3}
                      maxLength={500}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Lane, pitch or anything the venue should know"
                    />
                  </label>
                  {error && (
                    <p className="form-feedback" role="alert" tabIndex={-1}>
                      {error}
                    </p>
                  )}
                  <button className="near-ink" type="submit" disabled={busy}>
                    {busy ? "Sending request…" : "Request this slot"}
                  </button>
                </form>
              ) : (
                <p className="near-empty">
                  <Link className="near-ink" to="/auth/sign-in">
                    Sign in to request this slot
                  </Link>
                </p>
              )}
            </section>
            <section>
              <h2>Where it is</h2>
              <div className="near-map-wrap near-map-short">
                <ReachMap
                  center={{ lat: place.lat, lng: place.lng }}
                  pins={[
                    {
                      id: place._id,
                      lat: place.lat,
                      lng: place.lng,
                      label: place.name,
                    },
                  ]}
                  selectedId={place._id}
                />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
