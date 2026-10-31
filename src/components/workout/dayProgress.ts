import type {
  Workout,
  WorkoutItem,
  WorkoutLog,
  WorkoutStatus,
} from "../../types/domain";

export type AssignmentKey = "ai" | "you" | "coach" | "unknown";
export type MoveState = "logged" | "partial" | "open" | "skipped" | "missing";

export function exerciseKey(exerciseId: WorkoutItem["exerciseId"]) {
  if (!exerciseId) return "";
  if (typeof exerciseId === "string") return exerciseId;
  return exerciseId._id || exerciseId.name || "";
}

export function exerciseName(exerciseId: WorkoutItem["exerciseId"]) {
  if (!exerciseId || typeof exerciseId === "string") return "Exercise";
  return exerciseId.name || "Exercise";
}

export function logWorkoutId(log: WorkoutLog) {
  const id = log.workoutId as unknown;
  if (!id) return null;
  if (typeof id === "string") return id;
  if (typeof id === "object" && id && "_id" in (id as object)) {
    return String((id as { _id: string })._id);
  }
  return null;
}

export function assignmentSource(
  assignedBy: string | undefined,
  athleteId?: string,
): { key: AssignmentKey; label: string } {
  if (assignedBy === "ai") return { key: "ai", label: "AI draft" };
  if (athleteId && assignedBy === athleteId) {
    return { key: "you", label: "You planned this" };
  }
  if (assignedBy) return { key: "coach", label: "From your coach" };
  return { key: "unknown", label: "Assigned" };
}

export function statusWord(status: WorkoutStatus) {
  if (status === "completed") return "Logged";
  if (status === "skipped") return "Skipped";
  return "To log";
}

export function moveWord(state: MoveState) {
  if (state === "logged") return "Logged";
  if (state === "partial") return "Part done";
  if (state === "skipped") return "Skipped";
  if (state === "missing") return "Not recorded";
  return "To log";
}

export function dayMark(sessions: { status: WorkoutStatus }[]) {
  if (!sessions.length) return "";
  const done = sessions.filter((session) => session.status === "completed").length;
  const skipped = sessions.filter((session) => session.status === "skipped").length;
  if (skipped === sessions.length) return "Skip";
  return `${done}/${sessions.length}`;
}

function count(list: Workout[], status: WorkoutStatus) {
  return list.filter((workout) => workout.status === status).length;
}

function joinCounts(done: number, open: number, skipped: number) {
  const bits = [];
  if (done) bits.push(`${done} logged`);
  if (open) bits.push(`${open} still to log`);
  if (skipped) bits.push(`${skipped} skipped`);
  return bits.join(", ");
}

export function dayBrief(input: {
  workouts: Workout[];
  athleteId?: string;
  viewerIsSelf: boolean;
}) {
  const { workouts, athleteId, viewerIsSelf } = input;
  if (!workouts.length) return "";
  const coach = workouts.filter(
    (workout) => assignmentSource(workout.assignedBy, athleteId).key === "coach",
  );
  const own = workouts.filter(
    (workout) => assignmentSource(workout.assignedBy, athleteId).key === "you",
  );
  const drafts = workouts.filter(
    (workout) => assignmentSource(workout.assignedBy, athleteId).key === "ai",
  );

  if (viewerIsSelf && coach.length) {
    const open = coach.filter((workout) => workout.status === "planned");
    const done = count(coach, "completed");
    const skipped = count(coach, "skipped");
    let line: string;
    if (coach.length === 1 && open.length === 1) {
      line = `Your coach assigned ${open[0].title}, and it is still to log.`;
    } else if (coach.length === 1 && done === 1 && skipped === 0) {
      line = `Your coach assigned ${coach[0].title}. You have logged it.`;
    } else if (open.length === 0 && skipped === 0) {
      line = `Your coach assigned ${coach.length} sessions. You have logged all of them.`;
    } else {
      line = `Your coach assigned ${coach.length} sessions. ${joinCounts(done, open.length, skipped)}.`;
      if (open.length === 1) line += ` ${open[0].title} is still open.`;
      else if (open.length > 1) {
        line += ` Still open: ${open.map((workout) => workout.title).join(", ")}.`;
      }
    }
    if (own.length === 1) line += " You also planned 1 session yourself.";
    else if (own.length > 1) line += ` You also planned ${own.length} sessions yourself.`;
    if (drafts.length === 1) line += " 1 session is an AI draft.";
    else if (drafts.length > 1) line += ` ${drafts.length} sessions are AI drafts.`;
    return line;
  }

  if (viewerIsSelf) {
    const open = workouts.filter((workout) => workout.status === "planned");
    const done = count(workouts, "completed");
    const skipped = count(workouts, "skipped");
    const progress = joinCounts(done, open.length, skipped);
    if (drafts.length === workouts.length && workouts.length === 1) {
      const still =
        workouts[0].status === "planned"
          ? ", and it is still to log"
          : workouts[0].status === "completed"
            ? ". You have logged it"
            : ". It was skipped";
      return `${workouts[0].title} is an AI draft${still}. Your coach has not assigned this day.`;
    }
    if (own.length === workouts.length && workouts.length === 1) {
      const still =
        workouts[0].status === "planned"
          ? ", and it is still to log"
          : workouts[0].status === "completed"
            ? ". You have logged it"
            : ". It was skipped";
      return `${workouts[0].title} is a session you planned${still}. Your coach has not assigned this day.`;
    }
    const noun = workouts.length === 1 ? "session" : "sessions";
    let line = progress
      ? `${workouts.length} ${noun} on this day. ${progress}.`
      : `${workouts.length} ${noun} on this day.`;
    if (open.length === 1) line += ` ${open[0].title} is still open.`;
    else if (open.length > 1) {
      line += ` Still open: ${open.map((workout) => workout.title).join(", ")}.`;
    }
    return `${line} Your coach has not assigned this day.`;
  }

  const open = workouts.filter((workout) => workout.status === "planned");
  const done = count(workouts, "completed");
  const skipped = count(workouts, "skipped");
  const noun = workouts.length === 1 ? "session" : "sessions";
  const counts = joinCounts(done, open.length, skipped);
  return counts
    ? `${workouts.length} ${noun} on this day. ${counts}.`
    : `${workouts.length} ${noun} on this day.`;
}

export function todayReminder(input: {
  workouts: Workout[];
  athleteId?: string;
  viewerIsSelf: boolean;
}) {
  const { workouts, athleteId, viewerIsSelf } = input;
  const open = workouts.filter((workout) => workout.status === "planned");
  if (!open.length) return "";
  if (viewerIsSelf) {
    const fromCoach = open.filter(
      (workout) => assignmentSource(workout.assignedBy, athleteId).key === "coach",
    );
    if (fromCoach.length === 1) {
      return `Today your coach still has ${fromCoach[0].title} to log.`;
    }
    if (fromCoach.length > 1) {
      return `Today your coach still has ${fromCoach.length} sessions to log.`;
    }
    if (open.length === 1) return `Today still has ${open[0].title} to log.`;
    return `Today still has ${open.length} sessions to log.`;
  }
  if (open.length === 1) return `Today still has ${open[0].title} to log.`;
  return `Today still has ${open.length} sessions to log.`;
}

export interface MoveRow {
  name: string;
  state: MoveState;
  prescription: string;
  recordedLabel: string;
  notes: string;
}

function prescription(item: WorkoutItem) {
  const weight =
    item.targetWeightKg != null ? ` · ${item.targetWeightKg} kg` : "";
  return `${item.sets} × ${item.reps}${weight}`;
}

export function moveRows(
  workout: Workout,
  logs: WorkoutLog[],
  showSets: boolean,
): MoveRow[] {
  const linked = logs.filter((log) => logWorkoutId(log) === workout._id);
  const hasLog = linked.length > 0;
  return workout.items.map((item) => {
    const recorded = linked.reduce((sum, log) => {
      const match = log.items.find(
        (entry) => exerciseKey(entry.exerciseId) === exerciseKey(item.exerciseId),
      );
      return sum + (match?.sets.length ?? 0);
    }, 0);
    let state: MoveState;
    if (workout.status === "skipped") state = "skipped";
    else if (!showSets) state = workout.status === "completed" ? "logged" : "open";
    else if (item.sets > 0 && recorded >= item.sets) state = "logged";
    else if (recorded > 0) state = "partial";
    else if (workout.status === "completed" && !hasLog) state = "logged";
    else if (workout.status === "completed" && hasLog) state = "missing";
    else state = "open";

    const recordedLabel =
      showSets && (state === "logged" || state === "partial" || state === "missing" || state === "open") && hasLog
        ? `${recorded} of ${item.sets} sets recorded`
        : showSets && state === "open"
          ? `0 of ${item.sets} sets recorded`
          : "";

    return {
      name: exerciseName(item.exerciseId),
      state,
      prescription: prescription(item),
      recordedLabel,
      notes: item.notes?.trim() || "",
    };
  });
}

export function setTally(workouts: Workout[], logs: WorkoutLog[]) {
  let assigned = 0;
  let recorded = 0;
  for (const workout of workouts) {
    const linked = logs.filter((log) => logWorkoutId(log) === workout._id);
    for (const item of workout.items) {
      assigned += item.sets;
      recorded += linked.reduce((sum, log) => {
        const match = log.items.find(
          (entry) => exerciseKey(entry.exerciseId) === exerciseKey(item.exerciseId),
        );
        return sum + (match?.sets.length ?? 0);
      }, 0);
    }
  }
  return { assigned, recorded };
}

export function tallyLine(recorded: number, assigned: number, showRecorded: boolean) {
  const assignedLabel = `${assigned} ${assigned === 1 ? "set" : "sets"} assigned`;
  if (!showRecorded) return assignedLabel;
  const recordedLabel = `${recorded} ${recorded === 1 ? "set" : "sets"} recorded`;
  return `${recordedLabel} · ${assignedLabel}`;
}
