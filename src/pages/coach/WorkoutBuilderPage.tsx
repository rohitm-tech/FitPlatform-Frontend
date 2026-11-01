import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useExercises } from "../../queries/useExercises";
import {
  useMyAthletes,
  useCreateTemplate,
  useAssignTemplate,
  useTemplates,
} from "../../queries/useCoach";
import type { WorkoutTemplate } from "../../types/domain";
import type { SessionKind, StationMetric } from "../../types/domain";
import { SPORTS } from "../discover/catalog";
import {
  HYROX_STATIONS,
  SWIM_STROKES,
  formatPrescription,
  kindForSport,
  measurementHint,
  pieceName,
  sessionCountLabel,
} from "../../lib/sessionSports";
import type { SessionPiecePayload } from "../../services/endpoints/coachApi";

type Draft = {
  kind: SessionKind;
  label: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  restSec: number;
  distanceM: number | null;
  durationSec: number | null;
  paceSec: number | null;
  stroke: string;
  metric: StationMetric | "";
  effort: number | null;
  notes: string;
};

function emptyDraft(kind: SessionKind, sport: string): Draft {
  const base: Draft = {
    kind,
    label: "",
    exerciseId: "",
    exerciseName: "",
    sets: 1,
    reps: 10,
    targetWeightKg: null,
    restSec: 0,
    distanceM: null,
    durationSec: null,
    paceSec: null,
    stroke: "Freestyle",
    metric: "distance",
    effort: null,
    notes: "",
  };
  if (sport === "HYROX") {
    const station = HYROX_STATIONS[0];
    return {
      ...base,
      kind: "station",
      label: station.name,
      metric: station.metric,
      distanceM: station.metric === "distance" ? station.amount : null,
      reps: station.metric === "reps" ? station.amount : 0,
    };
  }
  if (kind === "swim") {
    return { ...base, label: "Freestyle", sets: 8, distanceM: 100, restSec: 20 };
  }
  if (kind === "endurance") {
    return { ...base, label: sport === "Cycling" ? "Ride" : "Run", distanceM: sport === "Cycling" ? 20000 : 5000 };
  }
  if (kind === "station") {
    return { ...base, label: "", metric: "reps", reps: 10 };
  }
  if (kind === "rounds") {
    return { ...base, label: sport === "Boxing" ? "Bag work" : "Rounds", sets: 3, durationSec: 180, restSec: 60 };
  }
  return { ...base, label: sport === "Yoga" ? "Flow" : "Practice", durationSec: 45 * 60, effort: 5 };
}

function draftProblem(item: Draft) {
  if (item.kind === "swim") {
    if (!item.stroke.trim()) return "Choose a stroke.";
    if (!item.distanceM || item.distanceM < 1) return "Enter a distance in metres.";
    return "";
  }
  if (item.kind === "endurance") {
    if (!item.label.trim()) return "Name this piece.";
    if (!(item.distanceM && item.distanceM > 0) && !(item.durationSec && item.durationSec > 0)) {
      return "Add a distance or a duration.";
    }
    return "";
  }
  if (item.kind === "station") {
    if (!item.label.trim()) return "Name this station.";
    if (item.metric === "reps" && !(item.reps > 0)) return "Enter the reps.";
    if (item.metric === "distance" && !(item.distanceM && item.distanceM > 0)) return "Enter a distance.";
    if (item.metric === "time" && !(item.durationSec && item.durationSec > 0)) return "Enter a time.";
    return "";
  }
  if (item.kind === "rounds") {
    if (!item.label.trim()) return "Name this block.";
    if (!item.durationSec || item.durationSec < 10) return "Enter how long each round lasts.";
    return "";
  }
  if (item.kind === "practice") {
    if (!item.label.trim()) return "Name this block.";
    if (!item.durationSec || item.durationSec < 60) return "Enter a duration of at least one minute.";
    return "";
  }
  return "";
}

function toPayload(item: Draft): SessionPiecePayload {
  const notes = item.notes.trim() || undefined;
  if (item.kind === "strength") {
    return {
      kind: "strength",
      exerciseId: item.exerciseId,
      label: item.exerciseName,
      sets: item.sets,
      reps: item.reps,
      targetWeightKg: item.targetWeightKg,
      restSec: item.restSec,
      notes,
    };
  }
  if (item.kind === "swim") {
    return {
      kind: "swim",
      label: item.label.trim() || item.stroke,
      stroke: item.stroke,
      sets: item.sets,
      distanceM: item.distanceM || 0,
      restSec: item.restSec,
      ...(item.paceSec ? { paceSec: item.paceSec } : {}),
      notes,
    };
  }
  if (item.kind === "endurance") {
    return {
      kind: "endurance",
      label: item.label.trim(),
      sets: item.sets,
      ...(item.distanceM ? { distanceM: item.distanceM } : {}),
      ...(item.durationSec ? { durationSec: item.durationSec } : {}),
      restSec: item.restSec,
      notes,
    };
  }
  if (item.kind === "station") {
    return {
      kind: "station",
      label: item.label.trim(),
      metric: item.metric === "reps" || item.metric === "time" ? item.metric : "distance",
      sets: 1,
      ...(item.metric === "reps" ? { reps: item.reps } : {}),
      ...(item.metric === "distance" && item.distanceM ? { distanceM: item.distanceM } : {}),
      ...(item.metric === "time" && item.durationSec ? { durationSec: item.durationSec } : {}),
      ...(item.targetWeightKg ? { targetWeightKg: item.targetWeightKg } : {}),
      restSec: item.restSec,
      notes,
    };
  }
  if (item.kind === "rounds") {
    return {
      kind: "rounds",
      label: item.label.trim(),
      sets: item.sets,
      durationSec: item.durationSec || 0,
      restSec: item.restSec,
      notes,
    };
  }
  return {
    kind: "practice",
    label: item.label.trim(),
    durationSec: item.durationSec || 0,
    ...(item.effort ? { effort: item.effort } : {}),
    notes,
  };
}

export default function WorkoutBuilderPage() {
  const [sport, setSport] = useState("Strength");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Draft[]>([]);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft("strength", "Strength"));
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [savedTemplate, setSavedTemplate] = useState<WorkoutTemplate | null>(null);
  const [error, setError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assigned, setAssigned] = useState(false);
  const kind = kindForSport(sport);
  const exercises = useExercises({ q: query || undefined, limit: 8 });
  const athletes = useMyAthletes();
  const templates = useTemplates();
  const save = useCreateTemplate();
  const assign = useAssignTemplate();
  const selectedTemplate =
    templates.data?.find((t) => t._id === templateId) ||
    (savedTemplate?._id === templateId ? savedTemplate : null);
  const templateSport = selectedTemplate?.sport || (selectedTemplate ? "Strength" : "");
  const roster = athletes.data?.athletes || [];
  const matchingAthletes = templateSport
    ? roster.filter((row) => (row.sport || "Strength") === templateSport)
    : [];

  const updateDraft = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const updateItem = (index: number, patch: Partial<Draft>) =>
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addDraft = () => {
    const problem = draftProblem({ ...draft, kind });
    if (problem) {
      setError(problem);
      return;
    }
    setItems((rows) => [...rows, { ...draft, kind, label: draft.label.trim() || draft.stroke }]);
    setDraft(emptyDraft(kind, sport));
    setError("");
  };

  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!title.trim() || !items.length) {
      setError("Give the template a title and add at least one piece.");
      return;
    }
    const problem = items.map((item) => draftProblem(item)).find(Boolean);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const res = await save.mutateAsync({
        title: title.trim(),
        sport,
        items: items.map(toPayload),
      });
      setSavedTemplate(res.data.data);
      setTemplateId(res.data.data._id);
      setAssigned(false);
      toast.success("Template saved. Choose athletes who train this sport, then a date.");
    } catch (e: any) {
      setError(e.response?.data?.message || "Template could not be saved. Your draft is still here.");
    }
  };

  const assignSession = async (event: FormEvent) => {
    event.preventDefault();
    setAssignError("");
    setAssigned(false);
    if (!templateId || !selectedAthletes.length || !date) {
      setAssignError("Choose a saved template, at least one athlete and a session date.");
      return;
    }
    try {
      await assign.mutateAsync({
        templateId,
        athleteIds: selectedAthletes,
        dates: [date],
      });
      setAssigned(true);
      toast.success("Session assigned");
    } catch (e: any) {
      setAssignError(e.response?.data?.message || "The session could not be assigned. Try again.");
    }
  };

  return (
    <div className="product-page builder-page">
      <div className="two-column-page">
        <form className="page-section" onSubmit={saveTemplate}>
          <h2>Create a template</h2>
          <label className="fp-label mt-5" htmlFor="template-sport">
            Sport
          </label>
          <select
            id="template-sport"
            className="fp-input"
            value={sport}
            onChange={(event) => {
              const next = event.target.value;
              setSport(next);
              setItems([]);
              setDraft(emptyDraft(kindForSport(next), next));
              setError("");
            }}
          >
            {SPORTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="section-note">{measurementHint(sport)}</p>
          <label className="fp-label mt-5" htmlFor="template-title">
            Template title
          </label>
          <input
            id="template-title"
            className="fp-input"
            required
            maxLength={120}
            value={title}
            placeholder={kind === "strength" ? "e.g. Full-body foundations" : `e.g. ${sport} session`}
            onChange={(e) => setTitle(e.target.value)}
          />
          {kind === "strength" ? (
            <>
              <label className="fp-label mt-5" htmlFor="builder-search">
                Add an exercise
              </label>
              <input
                id="builder-search"
                className="fp-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the exercise library"
              />
              {query && (
                <div className="search-options">
                  {exercises.isLoading ? (
                    <p className="empty-copy">Searching…</p>
                  ) : exercises.isError ? (
                    <p className="empty-copy">
                      Search could not load.{" "}
                      <button type="button" onClick={() => exercises.refetch()}>
                        Retry
                      </button>
                    </p>
                  ) : exercises.data?.exercises.length ? (
                    exercises.data.exercises.map((ex) => (
                      <button
                        type="button"
                        key={ex._id}
                        onClick={() => {
                          setItems((rows) => [
                            ...rows,
                            {
                              ...emptyDraft("strength", sport),
                              kind: "strength",
                              exerciseId: ex._id,
                              exerciseName: ex.name,
                              label: ex.name,
                              sets: 3,
                              reps: 10,
                              targetWeightKg: 0,
                              restSec: 90,
                            },
                          ]);
                          setQuery("");
                        }}
                      >
                        {ex.name}
                      </button>
                    ))
                  ) : (
                    <p className="empty-copy">No exercises match.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-5">
              <h3>Add a piece</h3>
              <PieceFields sport={sport} item={{ ...draft, kind }} onChange={updateDraft} />
              <button className="secondary-action mt-3" type="button" onClick={addDraft}>
                <Plus size={16} />
                Add to session
              </button>
            </div>
          )}
          <div className="mt-5">
            {items.map((item, i) => (
              <article key={`${item.label || item.exerciseId}-${i}`} className="builder-exercise">
                <div className="section-row">
                  <h3>{item.kind === "strength" ? item.exerciseName : item.label || item.stroke}</h3>
                  <button
                    type="button"
                    className="row-action"
                    aria-label={`Remove ${item.exerciseName || item.label}`}
                    onClick={() => setItems((rows) => rows.filter((_, index) => index !== i))}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                {item.kind === "strength" ? (
                  <div className="field-row">
                    <NumberField label="Sets" value={item.sets} min={1} max={20} onChange={(sets) => updateItem(i, { sets })} />
                    <NumberField label="Reps" value={item.reps} min={1} max={1000} onChange={(reps) => updateItem(i, { reps })} />
                    <NumberField
                      label="Weight (kg)"
                      value={item.targetWeightKg ?? 0}
                      min={0}
                      max={1500}
                      step="any"
                      onChange={(targetWeightKg) => updateItem(i, { targetWeightKg })}
                    />
                    <NumberField label="Rest (sec)" value={item.restSec} min={0} max={600} onChange={(restSec) => updateItem(i, { restSec })} />
                  </div>
                ) : (
                  <PieceFields sport={sport} item={item} onChange={(patch) => updateItem(i, patch)} />
                )}
              </article>
            ))}
            {!items.length && (
              <p className="logger-empty">
                {kind === "strength"
                  ? "Add movements to define sets, reps, load and rest."
                  : `Add ${sport} pieces. ${measurementHint(sport)}`}
              </p>
            )}
          </div>
          {error && (
            <div className="form-feedback" role="alert">
              {error}
            </div>
          )}
          <button className="primary-action mt-5" disabled={save.isPending} type="submit">
            <Plus size={17} />
            {save.isPending ? "Saving template…" : "Save new template"}
          </button>
        </form>
        <div className="page-stack">
          <form className="page-section" onSubmit={assignSession}>
            <h2>Assign a saved session</h2>
            <p>Only athletes who train this sport with you can receive it.</p>
            {templates.isError ? (
              <div className="form-feedback">
                Templates could not load.{" "}
                <button type="button" onClick={() => templates.refetch()}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <label className="fp-label mt-5" htmlFor="saved-template">
                  Saved template
                </label>
                <select
                  id="saved-template"
                  className="fp-input"
                  value={templateId}
                  required
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setTemplateId(nextId);
                    setAssigned(false);
                    const next = templates.data?.find((template) => template._id === nextId);
                    const nextSport = next?.sport || "Strength";
                    const allowed = new Set(
                      roster.filter((row) => (row.sport || "Strength") === nextSport).map((row) => row.athlete._id),
                    );
                    setSelectedAthletes((rows) => rows.filter((id) => allowed.has(id)));
                  }}
                >
                  <option value="">{templates.isLoading ? "Loading templates…" : "Choose a session"}</option>
                  {templates.data?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} · {t.sport || "Strength"}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="template-preview">
                    <strong>
                      {selectedTemplate.title} · {selectedTemplate.sport || "Strength"}
                    </strong>
                    <ul>
                      {selectedTemplate.items.map((item, i) => (
                        <li key={i}>
                          <span>{pieceName(item)}</span>
                          <span>{formatPrescription(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            <fieldset className="mt-5">
              <legend className="fp-label">Assign to athletes</legend>
              {athletes.isLoading ? (
                <p role="status">Loading athletes…</p>
              ) : athletes.isError ? (
                <p className="field-error">
                  Athletes could not load.{" "}
                  <button type="button" onClick={() => athletes.refetch()}>
                    Retry
                  </button>
                </p>
              ) : !templateSport ? (
                <p className="section-note">Choose a template to see athletes who train that sport with you.</p>
              ) : matchingAthletes.length ? (
                matchingAthletes.map(({ athlete, sport: athleteSport }) => (
                  <label key={athlete._id} className="athlete-choice">
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete._id)}
                      onChange={() => {
                        setSelectedAthletes((rows) =>
                          rows.includes(athlete._id) ? rows.filter((id) => id !== athlete._id) : [...rows, athlete._id],
                        );
                        setAssigned(false);
                      }}
                    />
                    {athlete.name} · {athleteSport || "Strength"}
                  </label>
                ))
              ) : (
                <p className="section-note">
                  No athletes train {templateSport} with you yet. Invite one for that sport from Team overview.
                </p>
              )}
              {templateSport && roster.length > matchingAthletes.length && (
                <p className="section-note">
                  {roster.length - matchingAthletes.length}{" "}
                  {roster.length - matchingAthletes.length === 1 ? "athlete trains" : "athletes train"} a different
                  sport with you, so {templateSport === "Strength" ? "this gym session" : `this ${templateSport} session`}{" "}
                  is hidden from them.
                </p>
              )}
            </fieldset>
            <label className="fp-label mt-5" htmlFor="assign-date">
              Session date
            </label>
            <input
              id="assign-date"
              className="fp-input"
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setAssigned(false);
              }}
            />
            {assignError && (
              <div className="form-feedback" role="alert">
                {assignError}
              </div>
            )}
            {assigned && (
              <p className="assignment-success" role="status">
                <Check size={17} />
                {selectedTemplate?.title} assigned to {selectedAthletes.length}{" "}
                {selectedAthletes.length === 1 ? "athlete" : "athletes"} on{" "}
                {new Date(date + "T12:00:00").toLocaleDateString()}.
              </p>
            )}
            <button className="primary-action mt-5" type="submit" disabled={assign.isPending || assigned}>
              {assign.isPending ? "Assigning…" : assigned ? "Assigned" : "Assign session"}
            </button>
          </form>
          <section className="page-section">
            <h2>Your template library</h2>
            <p>{templates.data?.length || 0} reusable sessions</p>
            <ul className="data-list mt-3">
              {templates.data?.map((t) => {
                const gym = kindForSport(t.sport || "Strength") === "strength";
                return (
                  <li key={t._id}>
                    <div className="section-row">
                      <div>
                        <strong>{t.title}</strong>
                        <p>
                          {t.sport || "Strength"} · {sessionCountLabel(t.items.length, gym)}
                          {gym ? ` · ${t.items.reduce((n, item) => n + (item.sets || 0), 0)} sets` : ""}
                        </p>
                      </div>
                      <button
                        className="row-action"
                        onClick={() => {
                          setTemplateId(t._id);
                          setAssigned(false);
                          const allowed = new Set(
                            roster
                              .filter((row) => (row.sport || "Strength") === (t.sport || "Strength"))
                              .map((row) => row.athlete._id),
                          );
                          setSelectedAthletes((rows) => rows.filter((id) => allowed.has(id)));
                          document.getElementById("saved-template")?.focus();
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!templates.isLoading && !templates.data?.length && (
              <p className="empty-copy">Save your first session on the left, or approve an athlete’s AI draft.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PieceFields({
  sport,
  item,
  onChange,
}: {
  sport: string;
  item: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const kind = item.kind;
  return (
    <div className="field-row">
      {kind === "swim" && (
        <>
          <label className="numeric-field">
            Name
            <input className="fp-input" value={item.label} maxLength={80} onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <label className="numeric-field">
            Stroke
            <select className="fp-input" value={item.stroke} onChange={(e) => onChange({ stroke: e.target.value, label: item.label || e.target.value })}>
              {SWIM_STROKES.map((stroke) => (
                <option key={stroke}>{stroke}</option>
              ))}
            </select>
          </label>
          <NumberField label="Repeats" value={item.sets} min={1} max={100} onChange={(sets) => onChange({ sets })} />
          <NumberField label="Distance (m)" value={item.distanceM ?? 0} min={1} max={10000} onChange={(distanceM) => onChange({ distanceM })} />
          <NumberField label="Rest (sec)" value={item.restSec} min={0} max={600} onChange={(restSec) => onChange({ restSec })} />
          <NumberField
            label="Pace (sec / 100 m)"
            value={item.paceSec ?? 0}
            min={0}
            max={600}
            onChange={(paceSec) => onChange({ paceSec: paceSec || null })}
          />
        </>
      )}
      {kind === "endurance" && (
        <>
          <label className="numeric-field">
            Name
            <input className="fp-input" value={item.label} maxLength={80} required onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <NumberField label="Repeats" value={item.sets} min={1} max={100} onChange={(sets) => onChange({ sets })} />
          <NumberField label="Distance (m)" value={item.distanceM ?? 0} min={0} max={200000} onChange={(distanceM) => onChange({ distanceM: distanceM || null })} />
          <NumberField
            label="Duration (min)"
            value={item.durationSec ? Math.round(item.durationSec / 60) : 0}
            min={0}
            max={1440}
            onChange={(minutes) => onChange({ durationSec: minutes ? minutes * 60 : null })}
          />
          <NumberField label="Rest (sec)" value={item.restSec} min={0} max={3600} onChange={(restSec) => onChange({ restSec })} />
        </>
      )}
      {kind === "station" && (
        <>
          {sport === "HYROX" ? (
            <label className="numeric-field">
              Station
              <select
                className="fp-input"
                value={HYROX_STATIONS.some((station) => station.name === item.label) ? item.label : "Other"}
                onChange={(event) => {
                  const name = event.target.value;
                  const station = HYROX_STATIONS.find((entry) => entry.name === name);
                  if (!station) {
                    onChange({ label: "", metric: "reps" });
                    return;
                  }
                  onChange({
                    label: station.name,
                    metric: station.metric,
                    distanceM: station.metric === "distance" ? station.amount : null,
                    reps: station.metric === "reps" ? station.amount : 0,
                    durationSec: null,
                  });
                }}
              >
                {HYROX_STATIONS.map((station) => (
                  <option key={station.name}>{station.name}</option>
                ))}
                <option>Other</option>
              </select>
            </label>
          ) : null}
          {(sport !== "HYROX" || !HYROX_STATIONS.some((station) => station.name === item.label)) && (
            <label className="numeric-field">
              Name
              <input className="fp-input" value={item.label} maxLength={80} onChange={(e) => onChange({ label: e.target.value })} />
            </label>
          )}
          <label className="numeric-field">
            Measure
            <select
              className="fp-input"
              value={item.metric || "distance"}
              onChange={(e) => onChange({ metric: e.target.value as StationMetric })}
            >
              <option value="reps">Reps</option>
              <option value="distance">Distance</option>
              <option value="time">Time</option>
            </select>
          </label>
          {item.metric === "reps" && (
            <NumberField label="Reps" value={item.reps} min={1} max={1000} onChange={(reps) => onChange({ reps })} />
          )}
          {item.metric === "distance" && (
            <NumberField label="Distance (m)" value={item.distanceM ?? 0} min={1} max={100000} onChange={(distanceM) => onChange({ distanceM })} />
          )}
          {item.metric === "time" && (
            <NumberField label="Time (sec)" value={item.durationSec ?? 0} min={1} max={7200} onChange={(durationSec) => onChange({ durationSec })} />
          )}
          <NumberField
            label="Load (kg)"
            value={item.targetWeightKg ?? 0}
            min={0}
            max={500}
            onChange={(targetWeightKg) => onChange({ targetWeightKg: targetWeightKg || null })}
          />
          <NumberField label="Rest (sec)" value={item.restSec} min={0} max={600} onChange={(restSec) => onChange({ restSec })} />
        </>
      )}
      {kind === "rounds" && (
        <>
          <label className="numeric-field">
            Name
            <input className="fp-input" value={item.label} maxLength={80} onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <NumberField label="Rounds" value={item.sets} min={1} max={30} onChange={(sets) => onChange({ sets })} />
          <NumberField
            label="Work (min)"
            value={item.durationSec ? item.durationSec / 60 : 0}
            min={1}
            max={30}
            step="0.5"
            onChange={(minutes) => onChange({ durationSec: Math.round(minutes * 60) })}
          />
          <NumberField label="Rest (sec)" value={item.restSec} min={0} max={600} onChange={(restSec) => onChange({ restSec })} />
        </>
      )}
      {kind === "practice" && (
        <>
          <label className="numeric-field">
            Name
            <input className="fp-input" value={item.label} maxLength={80} onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <NumberField
            label="Duration (min)"
            value={item.durationSec ? Math.round(item.durationSec / 60) : 0}
            min={1}
            max={240}
            onChange={(minutes) => onChange({ durationSec: minutes * 60 })}
          />
          <NumberField
            label="Effort (1–10)"
            value={item.effort ?? 0}
            min={0}
            max={10}
            onChange={(effort) => onChange({ effort: effort || null })}
          />
        </>
      )}
      {kind !== "strength" && (
        <label className="numeric-field">
          Notes
          <input className="fp-input" value={item.notes} maxLength={300} onChange={(e) => onChange({ notes: e.target.value })} />
        </label>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="numeric-field">
      {label}
      <input
        className="fp-input"
        type="number"
        min={min}
        max={max}
        step={step || 1}
        required
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
