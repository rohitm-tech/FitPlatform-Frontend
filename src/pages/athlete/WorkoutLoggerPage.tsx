import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  useAthleteLogs,
  useAthleteWorkouts,
  useLogWorkout,
} from "../../queries/useAthlete";
import { useExercises } from "../../queries/useExercises";
import type { SetLog } from "../../types/domain";
import { isGymSession } from "../../lib/sessionSports";
import { SportSessionLog } from "../../components/athlete/SportSessionLog";
type Item = { exerciseId: string; exerciseName: string; sets: SetLog[] };
const BODY_AREAS: {
  id: string;
  label: string;
  group?: string;
  type?: string;
}[] = [
  { id: "chest", label: "Chest", group: "chest" },
  { id: "back", label: "Back", group: "back" },
  { id: "shoulders", label: "Shoulders", group: "shoulders" },
  { id: "arms", label: "Arms", group: "arms" },
  { id: "legs", label: "Legs", group: "legs" },
  { id: "core", label: "Core", group: "core" },
  { id: "cardio", label: "Cardio", type: "cardio" },
  { id: "mobility", label: "Mobility", type: "mobility" },
];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export default function WorkoutLoggerPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const workoutId = params.get("workoutId");
  const navigate = useNavigate();
  const workouts = useAthleteWorkouts(user?._id);
  const assigned = useMemo(
    () => workouts.data?.find((w) => w._id === workoutId),
    [workouts.data, workoutId],
  );
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(params.get("date") || today());
  const [duration, setDuration] = useState(30);
  const [effort, setEffort] = useState(6);
  const [pain, setPain] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const initialized = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const saved = useRef(false);
  const logs = useAthleteLogs(user?._id);
  const catalog = useExercises({ limit: 200 });
  const log = useLogWorkout(user?._id);
  const area = BODY_AREAS.find((item) => item.id === areaId);
  const addedIds = useMemo(
    () => new Set(items.map((item) => item.exerciseId)),
    [items],
  );
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const entry of logs.data || []) {
      for (const item of entry.items) {
        if (!item.exerciseId || typeof item.exerciseId === "string") continue;
        if (seen.has(item.exerciseId._id)) continue;
        seen.add(item.exerciseId._id);
        list.push({ id: item.exerciseId._id, name: item.exerciseId.name });
        if (list.length === 8) return list;
      }
    }
    return list;
  }, [logs.data]);
  const visibleExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (catalog.data?.exercises || []).filter((exercise) => {
      if (
        area?.group &&
        !exercise.primaryMuscles.some((muscle) => muscle.group === area.group)
      ) {
        return false;
      }
      if (area?.type && exercise.type !== area.type) return false;
      if (query && !exercise.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [catalog.data, area, search]);
  const showCatalog = Boolean(area || search.trim());
  useEffect(() => {
    if (assigned && !initialized.current) {
      setItems(
        assigned.items.map((item) => ({
          exerciseId:
            !item.exerciseId || typeof item.exerciseId === "string"
              ? item.exerciseId || ""
              : item.exerciseId._id,
          exerciseName:
            !item.exerciseId || typeof item.exerciseId === "string"
              ? item.label || "Exercise"
              : item.exerciseId.name,
          sets: Array.from({ length: item.sets }, () => ({
            reps: item.reps ?? 0,
            weightKg: item.targetWeightKg ?? 0,
          })),
        })),
      );
      initialized.current = true;
    }
  }, [assigned]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (items.length && !saved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items.length]);
  const addExercise = (exerciseId: string, exerciseName: string) => {
    setItems((rows) =>
      rows.some((row) => row.exerciseId === exerciseId)
        ? rows
        : [
            ...rows,
            {
              exerciseId,
              exerciseName,
              sets: [{ reps: 10, weightKg: 0 }],
            },
          ],
    );
  };
  const updateSet = (
    i: number,
    j: number,
    field: keyof SetLog,
    value: number,
  ) =>
    setItems((rows) =>
      rows.map((row, index) =>
        index !== i
          ? row
          : {
              ...row,
              sets: row.sets.map((set, k) =>
                k === j ? { ...set, [field]: value } : set,
              ),
            },
      ),
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!items.length) {
      setError("Add at least one exercise and the sets you completed.");
      return;
    }
    if (workoutId && !assigned) {
      setError(
        "This assigned session could not be loaded. Return to your calendar and try again.",
      );
      return;
    }
    try {
      await log.mutateAsync({
        workoutId: workoutId || null,
        date: new Date(date + "T12:00:00").toISOString(),
        items: items.map(({ exerciseId, sets }) => ({
          exerciseId,
          sets: sets.map((set) => ({ reps: set.reps, weightKg: set.weightKg })),
        })),
        durationMin: duration,
        perceivedEffort: effort,
        painFlag: pain,
        notes,
      });
      saved.current = true;
      navigate("/athlete/history");
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "Your workout could not be saved. Your entries are still here. Try again.",
      );
    }
  };
  if (workoutId && workouts.isLoading)
    return (
      <div className="product-page">
        <div className="page-state" role="status">
          Loading assigned session…
        </div>
      </div>
    );
  if (assigned && !isGymSession(assigned)) {
    return <SportSessionLog workout={assigned} athleteId={user?._id} />;
  }
  return (
    <div className="product-page logger-page">
      <Link className="page-back" to="/athlete/history">
        <ArrowLeft size={16} />
        Training calendar
      </Link>
      <form onSubmit={submit}>
        {error && (
          <div
            ref={errorRef}
            className="form-feedback"
            tabIndex={-1}
            role="alert"
          >
            {error}
          </div>
        )}
        {workoutId && !assigned && (
          <div className="form-feedback" role="alert">
            The assigned session is unavailable.{" "}
            <button type="button" onClick={() => workouts.refetch()}>
              Retry
            </button>
          </div>
        )}
        <div className="two-column-page">
          <section className="page-section">
            <h2>Exercises & sets</h2>
            <p>
              {assigned
                ? "Session targets are prefilled. Update the sets to match what you completed, and add anything else from a body area."
                : "Pick a body area to see the movements, then add each one you did. Search only if you already know the name."}
            </p>
            <div className="logger-areas" role="group" aria-label="Body areas">
              {BODY_AREAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={areaId === item.id}
                  onClick={() =>
                    setAreaId((current) => (current === item.id ? "" : item.id))
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            {recent.length > 0 && (
              <div className="logger-recent">
                <p id="recent-exercises-label">From your recent sessions</p>
                <div
                  className="logger-recent-list"
                  role="group"
                  aria-labelledby="recent-exercises-label"
                >
                  {recent.map((exercise) => {
                    const added = addedIds.has(exercise.id);
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        aria-pressed={added}
                        aria-label={
                          added
                            ? `${exercise.name} is in this session`
                            : `Add ${exercise.name}`
                        }
                        onClick={() => addExercise(exercise.id, exercise.name)}
                      >
                        {exercise.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <label className="fp-label mt-5" htmlFor="exercise-search">
              Search by name
            </label>
            <input
              id="exercise-search"
              className="fp-input"
              type="search"
              placeholder="Try bench, squat, row…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {showCatalog && (
              <div
                className="logger-browse"
                role="region"
                aria-label={
                  area
                    ? `${area.label} exercises`
                    : "Exercises matching your search"
                }
              >
                {catalog.isLoading ? (
                  <p className="logger-browse-status" role="status">
                    Loading movements…
                  </p>
                ) : catalog.isError ? (
                  <p className="logger-browse-status">
                    The exercise library couldn’t be loaded.{" "}
                    <button type="button" onClick={() => catalog.refetch()}>
                      Retry
                    </button>
                  </p>
                ) : visibleExercises.length ? (
                  <ul>
                    {visibleExercises.map((exercise) => {
                      const added = addedIds.has(exercise._id);
                      const detail = [
                        exercise.primaryMuscles
                          .map((muscle) => muscle.displayName)
                          .join(", "),
                        exercise.equipment.join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li key={exercise._id}>
                          <button
                            type="button"
                            className="logger-browse-row"
                            aria-pressed={added}
                            aria-label={
                              added
                                ? `${exercise.name} is in this session`
                                : `Add ${exercise.name}`
                            }
                            onClick={() =>
                              addExercise(exercise._id, exercise.name)
                            }
                          >
                            <span className="logger-browse-copy">
                              <strong>{exercise.name}</strong>
                              {detail && <span>{detail}</span>}
                            </span>
                            <em className="logger-browse-state">
                              {added ? "Added" : "Add"}
                            </em>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="logger-browse-status">
                    {area && !search.trim()
                      ? `No ${area.label.toLowerCase()} movements are in the library yet.`
                      : area && search.trim()
                        ? `Nothing in ${area.label} matches that name.`
                        : "No exercises match that name."}{" "}
                    {area && search.trim() && (
                      <button type="button" onClick={() => setAreaId("")}>
                        Search the whole library
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}
            <div className="mt-5">
              {items.map((item, i) => (
                <article
                  className="logger-exercise"
                  key={`${item.exerciseId}-${i}`}
                >
                  <div className="section-row">
                    <h3>{item.exerciseName}</h3>
                    <button
                      type="button"
                      className="row-action"
                      aria-label={`Remove ${item.exerciseName}`}
                      onClick={() =>
                        setItems((rows) =>
                          rows.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  {item.sets.map((set, j) => (
                    <div className="logger-set" key={j}>
                      <span>Set {j + 1}</span>
                      <label className="numeric-field">
                        Reps
                        <input
                          aria-label={`${item.exerciseName} set ${j + 1} reps`}
                          className="fp-input"
                          type="number"
                          min={0}
                          max={1000}
                          step={1}
                          required
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(i, j, "reps", Number(e.target.value))
                          }
                        />
                      </label>
                      <label className="numeric-field">
                        Weight (kg)
                        <input
                          aria-label={`${item.exerciseName} set ${j + 1} weight in kilograms`}
                          className="fp-input"
                          type="number"
                          min={0}
                          max={1500}
                          step="any"
                          required
                          value={set.weightKg}
                          onChange={(e) =>
                            updateSet(i, j, "weightKg", Number(e.target.value))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="row-action"
                        aria-label={`Remove ${item.exerciseName} set ${j + 1}`}
                        disabled={item.sets.length === 1}
                        onClick={() =>
                          setItems((rows) =>
                            rows.map((row, k) =>
                              k === i
                                ? {
                                    ...row,
                                    sets: row.sets.filter((_, n) => n !== j),
                                  }
                                : row,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="row-action mt-3"
                    onClick={() =>
                      setItems((rows) =>
                        rows.map((row, k) =>
                          k === i
                            ? {
                                ...row,
                                sets: [...row.sets, { ...row.sets.at(-1)! }],
                              }
                            : row,
                        ),
                      )
                    }
                  >
                    <Plus size={16} />
                    Add set
                  </button>
                </article>
              ))}
              {!items.length && (
                <p className="logger-empty">
                  {showCatalog
                    ? "Movements you add show up here, ready for sets."
                    : "Choose a body area to see exercises you can add."}
                </p>
              )}
            </div>
          </section>
          <section className="page-section">
            <h2>How did it go?</h2>
            <div className="field-row mt-5">
              <label className="numeric-field">
                Session date
                <input
                  className="fp-input"
                  type="date"
                  max={today()}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="numeric-field">
                Duration (min)
                <input
                  className="fp-input"
                  type="number"
                  min={1}
                  max={600}
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="fp-label mt-6" htmlFor="effort">
              Perceived effort · {effort}/10
            </label>
            <input
              id="effort"
              type="range"
              min={1}
              max={10}
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value))}
              className="w-full"
            />
            <p className="section-note">
              1 is very easy. 10 is your maximum effort.
            </p>
            <label className="athlete-choice mt-4">
              <input
                type="checkbox"
                checked={pain}
                onChange={(e) => setPain(e.target.checked)}
              />
              I felt pain or discomfort
            </label>
            {pain && (
              <p className="field-error">
                Stop painful exercise and seek a qualified professional’s
                advice.
              </p>
            )}
            <label className="fp-label mt-5" htmlFor="session-notes">
              Session notes <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="session-notes"
              className="fp-input"
              rows={4}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What felt good? What was difficult?"
            />
            <p className="section-note">
              Saving queues an automatic completion and recovery review. Your
              coach approves any proposed plan changes.
            </p>
            <div className="logger-actions">
              <Link className="secondary-action" to="/athlete/history">
                Cancel
              </Link>
              <button
                className="primary-action"
                type="submit"
                disabled={log.isPending || (!!workoutId && !assigned)}
              >
                {log.isPending ? "Saving session…" : "Save workout"}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
