import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useAthleteWorkouts, useLogWorkout } from "../../queries/useAthlete";
import { useExercises } from "../../queries/useExercises";
import type { SetLog } from "../../types/domain";

interface LoggerItem {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export default function WorkoutLoggerPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get("workoutId");
  const navigate = useNavigate();

  const { data: workouts } = useAthleteWorkouts(user?._id);
  const activeWorkout = useMemo(
    () => workouts?.find((w) => w._id === workoutId),
    [workouts, workoutId],
  );

  const [startedAt] = useState(Date.now);
  const [items, setItems] = useState<LoggerItem[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [perceivedEffort, setPerceivedEffort] = useState(6);
  const [painFlag, setPainFlag] = useState(false);
  const [notes, setNotes] = useState("");
  const logWorkout = useLogWorkout(user?._id);

  const { data: searchResults } = useExercises({
    q: exerciseQuery || undefined,
    limit: 8,
  });

  useEffect(() => {
    if (activeWorkout && items.length === 0) {
      setItems(
        activeWorkout.items.map((item) => ({
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
    }
  }, [activeWorkout, items.length]);

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setItems((prev) => [
      ...prev,
      { exerciseId, exerciseName, sets: [{ reps: 10, weightKg: 0 }] },
    ]);
    setExerciseQuery("");
  };

  const updateSet = (
    itemIndex: number,
    setIndex: number,
    field: keyof SetLog,
    value: number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i !== itemIndex
          ? item
          : {
              ...item,
              sets: item.sets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s,
              ),
            },
      ),
    );
  };

  const addSet = (itemIndex: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i !== itemIndex
          ? item
          : { ...item, sets: [...item.sets, { reps: 10, weightKg: 0 }] },
      ),
    );
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    try {
      await logWorkout.mutateAsync({
        workoutId: workoutId || null,
        items: items.map((item) => ({
          exerciseId: item.exerciseId,
          sets: item.sets,
        })),
        durationMin: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
        perceivedEffort,
        painFlag,
        notes,
      });
      toast.success("Workout logged");
      navigate("/athlete");
    } catch {
      toast.error("Could not log workout");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">
        {activeWorkout ? activeWorkout.title : "Log a workout"}
      </h1>

      <div className="mt-4">
        <input
          className="fp-input"
          placeholder="Add an exercise…"
          value={exerciseQuery}
          onChange={(e) => setExerciseQuery(e.target.value)}
        />
        {exerciseQuery && searchResults && (
          <ul className="mt-1 fp-surface rounded-lg">
            {searchResults.exercises.map((ex) => (
              <li key={ex._id}>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:opacity-80"
                  onClick={() => addExercise(ex._id, ex.name)}
                >
                  {ex.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((item, itemIndex) => (
          <div
            key={`${item.exerciseId}-${itemIndex}`}
            className="fp-surface rounded-lg p-3"
          >
            <p className="font-medium">{item.exerciseName}</p>
            <div className="mt-2 flex flex-col gap-2">
              {item.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--fp-text-muted)" }}>
                    Set {setIndex + 1}
                  </span>
                  <input
                    type="number"
                    className="fp-input !w-20"
                    value={set.reps}
                    onChange={(e) =>
                      updateSet(
                        itemIndex,
                        setIndex,
                        "reps",
                        Number(e.target.value),
                      )
                    }
                  />
                  <span>reps ×</span>
                  <input
                    type="number"
                    className="fp-input !w-24"
                    value={set.weightKg}
                    onChange={(e) =>
                      updateSet(
                        itemIndex,
                        setIndex,
                        "weightKg",
                        Number(e.target.value),
                      )
                    }
                  />
                  <span>kg</span>
                </div>
              ))}
              <button
                className="w-fit text-xs underline"
                onClick={() => addSet(itemIndex)}
              >
                + Add set
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fp-text-muted)" }}>
            No exercises added yet.
          </p>
        )}
      </div>

      <div className="mt-6 fp-surface rounded-lg p-3">
        <label className="fp-label" htmlFor="effort">
          Perceived effort (1-10)
        </label>
        <input
          id="effort"
          type="range"
          min={1}
          max={10}
          value={perceivedEffort}
          onChange={(e) => setPerceivedEffort(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-sm">{perceivedEffort}/10</p>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={painFlag}
            onChange={(e) => setPainFlag(e.target.checked)}
          />
          I felt pain or discomfort during this workout
        </label>
        {painFlag && (
          <p className="mt-1 text-xs" style={{ color: "var(--fp-danger)" }}>
            Consider seeing a professional before your next session.
          </p>
        )}

        <label className="fp-label mt-3" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          className="fp-input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        className="mt-4 w-full rounded-lg border px-4 py-2 text-sm font-medium"
        style={{ borderColor: "var(--fp-border)" }}
        onClick={handleSubmit}
        disabled={logWorkout.isPending}
      >
        {logWorkout.isPending ? "Saving…" : "Finish workout"}
      </button>
    </div>
  );
}
