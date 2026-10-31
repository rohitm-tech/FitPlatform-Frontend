import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { money } from "../marketplace/marketplaceShared";
import { ReachMap } from "../../components/discover/ReachMap";
import { useAuth } from "../../hooks/useAuth";
import type { UserProfile } from "../../types/domain";
import {
  BENGALURU,
  KINDS,
  RADII,
  SPORTS,
  findingLine,
  noun,
  priceUnitLabel,
  widerRadius,
  type Kind,
} from "./catalog";

type Origin = {
  lat: number;
  lng: number;
  source: "demo" | "device" | "profile";
  label?: string;
};

type Result = {
  id: string;
  kind: Kind;
  name: string;
  area: string;
  sport: string;
  detail: string;
  distanceKm: number;
  priceMinor: number | null;
  priceUnit: string;
  pricePrefix: string;
  accepting: boolean | null;
  remote: boolean;
  isDemo: boolean;
  lat: number;
  lng: number;
};

type Payload = {
  origin: { label: string; source: string; lat: number; lng: number };
  radiusKm: number;
  counts: Record<Kind, number>;
  results: Result[];
  nearest: { name: string; distanceKm: number } | null;
  catalogueCity: string;
};

function Price({
  minor,
  unit,
  prefix,
}: {
  minor: number | null;
  unit: string;
  prefix: string;
}) {
  if (minor == null)
    return (
      <p className="near-price">
        <span>Rate not listed</span>
      </p>
    );
  const free = minor === 0;
  return (
    <p className={free ? "near-price is-zero" : "near-price"}>
      <strong>
        {prefix ? `${prefix} ${money(minor)}` : money(minor)}
      </strong>
      <span>{priceUnitLabel(free ? "none" : unit)}</span>
    </p>
  );
}

function savedOrigin(location: UserProfile["location"]): Origin | null {
  if (location?.latitude == null || location.longitude == null) return null;
  return {
    lat: location.latitude,
    lng: location.longitude,
    source: "profile",
    label: location.area || location.city || "your area",
  };
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const home = savedOrigin(user?.profile?.location);
  const [origin, setOrigin] = useState<Origin>(
    () => home ?? { ...BENGALURU, source: "demo" },
  );
  const [radiusKm, setRadiusKm] = useState<number>(8);
  const [kind, setKind] = useState<Kind>("coach");
  const [sport, setSport] = useState<(typeof SPORTS)[number] | "all">("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [selected, setSelected] = useState("");
  const [panel, setPanel] = useState<"list" | "map">("list");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: ["discover", origin, radiusKm, kind, sport, q, accepting],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.get("/discover", {
          params: {
            lat: origin.lat,
            lng: origin.lng,
            radiusKm,
            kind,
            sport,
            q,
            origin: origin.source,
            ...(origin.label ? { label: origin.label } : {}),
            ...(accepting && kind === "coach" ? { accepting: "true" } : {}),
          },
        })
      ).data.data as Payload,
  });

  const data = query.data;
  const results = data?.results ?? [];
  const active =
    results.find((row) => row.id === selected) ?? results[0] ?? null;
  const placeLabel = data?.origin.label ?? "Bengaluru";
  const count = data?.counts[kind];
  const kindLabel = KINDS.find(([id]) => id === kind)?.[1] ?? "Results";
  const nextRadius = data
    ? widerRadius(radiusKm, data.nearest?.distanceKm ?? null)
    : null;
  const farFromCatalogue =
    origin.source === "device" &&
    data?.nearest != null &&
    data.nearest.distanceKm > 25 &&
    results.length === 0;

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError(
        "This browser has no location. Distances stay centred on Bengaluru.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "device",
        });
        setLocateError("");
        setLocating(false);
      },
      () => {
        setLocateError(
          "Location is blocked. Distances stay centred on Bengaluru.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <div className="product-page near-page" data-panel={panel}>
      <h1>Near you</h1>
      <p className="near-finding" aria-live="polite">
        {count == null
          ? "Looking up coaches and places."
          : findingLine(count, kind, radiusKm, placeLabel)}{" "}
        Sample rates from the demo catalogue. A request does not confirm a
        slot or take payment.
      </p>
      <div className="near-counts" role="group" aria-label="What to look for">
        {KINDS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="near-count"
            aria-pressed={kind === id}
            onClick={() => setKind(id)}
          >
            <span>{label}</span>
            {data ? (
              <strong>{data.counts[id]}</strong>
            ) : (
              <strong className="near-bar">
                <span className="sr-only">Loading</span>
              </strong>
            )}
          </button>
        ))}
      </div>
      <div className="near-tools">
        <label className="near-search">
          Search
          <input
            className="fp-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or area"
          />
        </label>
        <label>
          Sport
          <select
            className="fp-input"
            value={sport}
            onChange={(event) =>
              setSport(event.target.value as (typeof SPORTS)[number] | "all")
            }
          >
            <option value="all">All sports</option>
            {SPORTS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Radius
          <select
            className="fp-input"
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
          >
            {RADII.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
        {kind === "coach" && (
          <label className="near-accept">
            <input
              type="checkbox"
              checked={accepting}
              onChange={(event) => setAccepting(event.target.checked)}
            />
            Accepting athletes
          </label>
        )}
        <button
          type="button"
          className="near-ink"
          onClick={locate}
          disabled={locating}
        >
          {locating ? "Finding you…" : "Use my location"}
        </button>
      </div>
      {locateError && (
        <p className="near-note" role="status">
          {locateError}
        </p>
      )}
      <button
        type="button"
        className="secondary-action near-panel-toggle"
        onClick={() => setPanel((current) => (current === "list" ? "map" : "list"))}
      >
        {panel === "list" ? "Map" : "List"}
      </button>
      <div className="near-split">
        <section className="near-results" aria-busy={query.isFetching}>
          <h2>Inside {radiusKm} km</h2>
          {query.isError ? (
            <div className="near-error" role="alert">
              <p>Couldn’t load the catalogue.</p>
              <button type="button" className="near-ink" onClick={() => query.refetch()}>
                Retry
              </button>
            </div>
          ) : !data ? (
            <ul className="near-list" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <li className="near-row" key={index}>
                  <span className="near-bar" style={{ width: "40%" }} />
                  <span className="near-bar" />
                </li>
              ))}
            </ul>
          ) : results.length ? (
            <ul className="near-list">
              {results.map((row) => {
                const href =
                  row.kind === "coach" ? `/coaches/${row.id}` : `/places/${row.id}`;
                const meta = [
                  row.area,
                  row.sport,
                  row.kind === "coach" && row.accepting === false
                    ? "Not accepting athletes"
                    : "",
                  row.remote ? "Also online" : "",
                  row.isDemo ? "Demo" : "",
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li
                    key={`${row.kind}-${row.id}`}
                    id={`near-row-${row.id}`}
                    className={
                      active?.id === row.id ? "near-row is-selected" : "near-row"
                    }
                  >
                    <Link className="near-name" to={href}>
                      {row.name}
                    </Link>
                    <p className="near-meta">{meta}</p>
                    <button
                      type="button"
                      className="near-distance"
                      aria-pressed={active?.id === row.id}
                      aria-label={`Show ${row.name} on the map, ${row.distanceKm.toFixed(1)} kilometres`}
                      onClick={() => {
                        setSelected(row.id);
                        setPanel("map");
                      }}
                    >
                      {row.distanceKm.toFixed(1)} km
                    </button>
                    <Price
                      minor={row.priceMinor}
                      unit={row.priceUnit}
                      prefix={row.pricePrefix}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="near-empty">
              <p>
                No {noun(kind, 0)} inside {radiusKm} km of {placeLabel}.
              </p>
              {data.nearest && (
                <p>
                  Nearest is {data.nearest.name},{" "}
                  {data.nearest.distanceKm.toFixed(1)} km away.
                </p>
              )}
              {farFromCatalogue ? (
                <button
                  type="button"
                  className="near-ink"
                  onClick={() => setOrigin({ ...BENGALURU, source: "demo" })}
                >
                  Show the Bengaluru catalogue
                </button>
              ) : nextRadius ? (
                <button
                  type="button"
                  className="near-ink"
                  onClick={() => setRadiusKm(nextRadius)}
                >
                  Widen to {nextRadius} km
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setSearch("");
                    setSport("all");
                    setAccepting(false);
                  }}
                >
                  Clear the search
                </button>
              )}
            </div>
          )}
        </section>
        <div
          className="near-map-wrap"
          role="region"
          aria-label={`Map of ${kindLabel.toLowerCase()} inside ${radiusKm} kilometres`}
        >
          <ReachMap
            center={{ lat: origin.lat, lng: origin.lng }}
            radiusKm={radiusKm}
            selectedId={active?.id}
            pins={results.map((row) => ({
              id: row.id,
              lat: row.lat,
              lng: row.lng,
              label: `${row.name}, ${row.distanceKm.toFixed(1)} kilometres`,
            }))}
            layoutKey={panel}
            onSelect={(id) => {
              setSelected(id);
              document.getElementById(`near-row-${id}`)?.scrollIntoView({
                block: "nearest",
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
