import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAthleteWorkouts, useLogWorkout } from "../../queries/useAthlete";
import { useExercises } from "../../queries/useExercises";
import type { SetLog } from "../../types/domain";
type Item = { exerciseId: string; exerciseName: string; sets: SetLog[] };
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
  const [date, setDate] = useState(params.get("date") || today());
  const [duration, setDuration] = useState(30);
  const [effort, setEffort] = useState(6);
  const [pain, setPain] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const initialized = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const saved = useRef(false);
  const searchResults = useExercises({ q: search || undefined, limit: 8 });
  const log = useLogWorkout(user?._id);
  useEffect(() => {
    if (assigned && !initialized.current) {
      setItems(
        assigned.items.map((item) => ({
          exerciseId:
            typeof item.exerciseId === "string"
              ? item.exerciseId
              : item.exerciseId._id,
          exerciseName:
            typeof item.exerciseId === "string"
              ? "Exercise"
              : item.exerciseId.name,
          sets: Array.from({ length: item.sets }, () => ({
            reps: item.reps,
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
        items: items.map(({ exerciseId, sets }) => ({ exerciseId, sets })),
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
  return (
    <div className="product-page logger-page">
      <Link className="page-back" to="/athlete/history">
        <ArrowLeft size={16} />
        Training calendar
      </Link>
      <div className="page-greeting">
        <div>
          <h1>{assigned?.title || "Log a workout"}</h1>
          <p>
            Record what you actually performed. Your coach can review the
            evidence.
          </p>
        </div>
      </div>
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
            {assigned && (
              <p>
                Session targets are prefilled. Update or remove sets to match
                what you completed.
              </p>
            )}
            <label className="fp-label mt-5" htmlFor="exercise-search">
              Add an exercise
            </label>
            <input
              id="exercise-search"
              className="fp-input"
              placeholder="Search the exercise library"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <div className="search-options">
                {searchResults.isLoading ? (
                  <p className="empty-copy">Searching…</p>
                ) : searchResults.isError ? (
                  <p className="empty-copy">
                    Search unavailable.{" "}
                    <button
                      type="button"
                      onClick={() => searchResults.refetch()}
                    >
                      Retry
                    </button>
                  </p>
                ) : searchResults.data?.exercises.length ? (
                  searchResults.data.exercises.map((ex) => (
                    <button
                      key={ex._id}
                      type="button"
                      onClick={() => {
                        setItems((rows) => [
                          ...rows,
                          {
                            exerciseId: ex._id,
                            exerciseName: ex.name,
                            sets: [{ reps: 10, weightKg: 0 }],
                          },
                        ]);
                        setSearch("");
                      }}
                    >
                      {ex.name}
                    </button>
                  ))
                ) : (
                  <p className="empty-copy">No exercises match that search.</p>
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
                  Search above to add your first exercise.
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
