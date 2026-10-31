import { useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import toast from "react-hot-toast";
import {
  useAthleteWorkouts,
  useRescheduleWorkout,
} from "../../queries/useAthlete";
import type { Workout, WorkoutStatus } from "../../types/domain";

const STATUS_COLOR: Record<WorkoutStatus, string> = {
  completed: "#22c55e",
  skipped: "#ef4444",
  planned: "#6b7280",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: workout._id,
    disabled: workout.status !== "planned",
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded-md p-1.5 text-xs"
      style={{
        background: STATUS_COLOR[workout.status] + "33",
        border: `1px solid ${STATUS_COLOR[workout.status]}`,
        cursor: workout.status === "planned" ? "grab" : "default",
        ...style,
      }}
    >
      {workout.title}
    </div>
  );
}

function DayColumn({ date, workouts }: { date: Date; workouts: Workout[] }) {
  const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[120px] flex-col gap-1 rounded-lg border p-1.5"
      style={{ borderColor: isOver ? "#77518b" : "var(--fp-border)" }}
    >
      <p
        className="text-center text-xs"
        style={{ color: "var(--fp-text-muted)" }}
      >
        {date.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
        })}
      </p>
      {workouts.map((w) => (
        <WorkoutCard key={w._id} workout={w} />
      ))}
    </div>
  );
}

// Drag a planned workout card onto another day to reschedule it — calls
// PATCH /athletes/:id/workouts/:workoutId under the hood, authorized by the
// same requireSelfOrCoach ownership check as every other athlete route.
export function WeeklyDragBoard({ athleteId }: { athleteId: string }) {
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const { data: workouts } = useAthleteWorkouts(athleteId, {
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });
  const reschedule = useRescheduleWorkout(athleteId);
  const [selected, setSelected] = useState("");
  const [newDate, setNewDate] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const workout = workouts?.find((w) => w._id === active.id);
    if (!workout) return;
    const newDate = new Date(String(over.id) + "T12:00:00");
    newDate.setHours(
      new Date(workout.date).getHours(),
      new Date(workout.date).getMinutes(),
    );
    reschedule.mutate(
      { workoutId: workout._id, date: newDate.toISOString() },
      { onError: () => toast.error("Could not reschedule") },
    );
  };

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="table-frame">
          <div className="grid grid-cols-7 gap-2" style={{ minWidth: 640 }}>
            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                date={day}
                workouts={(workouts ?? []).filter(
                  (w) => new Date(w.date).toDateString() === day.toDateString(),
                )}
              />
            ))}
          </div>
        </div>
      </DndContext>
      <details className="reschedule-controls">
        <summary>Reschedule without dragging</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selected || !newDate) return;
            try {
              await reschedule.mutateAsync({
                workoutId: selected,
                date: new Date(newDate + "T12:00:00").toISOString(),
              });
              toast.success("Session rescheduled");
              setSelected("");
              setNewDate("");
            } catch {
              toast.error("Could not reschedule session");
            }
          }}
        >
          <label className="numeric-field">
            Planned session
            <select
              className="fp-input"
              value={selected}
              required
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose a session</option>
              {workouts
                ?.filter((w) => w.status === "planned")
                .map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="numeric-field">
            New date
            <input
              className="fp-input"
              type="date"
              value={newDate}
              required
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>
          <button
            className="secondary-action"
            disabled={reschedule.isPending}
            type="submit"
          >
            {reschedule.isPending ? "Saving…" : "Move session"}
          </button>
        </form>
      </details>
    </div>
  );
}
