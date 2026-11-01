import { expect, it } from "vitest";
import type { Workout, WorkoutLog } from "../types/domain";
import {
  dayBrief,
  dayMark,
  moveRows,
  setTally,
  tallyLine,
  todayReminder,
} from "../components/workout/dayProgress";

function workout(partial: Partial<Workout> & Pick<Workout, "title" | "status">): Workout {
  return {
    _id: partial._id || partial.title,
    athleteId: "ath",
    assignedBy: partial.assignedBy ?? "coach-1",
    date: "2026-10-31T12:00:00.000Z",
    items: partial.items || [],
    ...partial,
  };
}

const bench = {
  exerciseId: { _id: "bench", name: "Bench press", slug: "bench-press" },
  sets: 4,
  reps: 8,
  targetWeightKg: 60,
  restSec: 90,
  notes: "Pause on the chest",
};

const row = {
  exerciseId: { _id: "row", name: "Seated row", slug: "seated-row" },
  sets: 3,
  reps: 10,
  targetWeightKg: null,
  restSec: 90,
  notes: "",
};

function log(workoutId: string, sets: { id: string; count: number }[]): WorkoutLog {
  return {
    _id: `log-${workoutId}`,
    athleteId: "ath",
    workoutId,
    date: "2026-10-31T12:00:00.000Z",
    durationMin: 40,
    perceivedEffort: 7,
    painFlag: false,
    notes: "",
    source: "app",
    items: sets.map((entry) => ({
      exerciseId: { _id: entry.id, name: entry.id, slug: entry.id },
      sets: Array.from({ length: entry.count }, () => ({ reps: 8, weightKg: 60 })),
    })),
  };
}

it("tells the athlete which coach session is still open", () => {
  const text = dayBrief({
    viewerIsSelf: true,
    athleteId: "ath",
    workouts: [
      workout({ title: "Training day — week 6", status: "completed", items: [bench] }),
      workout({ title: "Push + pull foundations", status: "planned", items: [row] }),
    ],
  });
  expect(text).toBe(
    "Your coach assigned 2 sessions. 1 logged, 1 still to log. Push + pull foundations is still open.",
  );
});

it("says when the only coach session is already logged", () => {
  expect(
    dayBrief({
      viewerIsSelf: true,
      athleteId: "ath",
      workouts: [workout({ title: "Squat day", status: "completed" })],
    }),
  ).toBe("Your coach assigned Squat day. You have logged it.");
});

it("names a self-planned session and says the coach did not assign it", () => {
  expect(
    dayBrief({
      viewerIsSelf: true,
      athleteId: "ath",
      workouts: [workout({ title: "Extra", status: "planned", assignedBy: "ath" })],
    }),
  ).toBe(
    "Extra is a session you planned, and it is still to log. Your coach has not assigned this day.",
  );
});

it("names the open session when the coach did not assign the day", () => {
  expect(
    dayBrief({
      viewerIsSelf: true,
      athleteId: "ath",
      workouts: [
        workout({ title: "Training day — week 6", status: "completed", assignedBy: "ai" }),
        workout({
          title: "Push + pull foundations",
          status: "planned",
          assignedBy: "ath",
        }),
      ],
    }),
  ).toBe(
    "2 sessions on this day. 1 logged, 1 still to log. Push + pull foundations is still open. Your coach has not assigned this day.",
  );
});

it("names an AI draft that is still to log", () => {
  expect(
    dayBrief({
      viewerIsSelf: true,
      athleteId: "ath",
      workouts: [workout({ title: "Training day 1", status: "planned", assignedBy: "ai" })],
    }),
  ).toBe(
    "Training day 1 is an AI draft, and it is still to log. Your coach has not assigned this day.",
  );
});

it("counts the day for a coach looking at an athlete", () => {
  expect(
    dayBrief({
      viewerIsSelf: false,
      athleteId: "ath",
      workouts: [
        workout({ title: "A", status: "completed" }),
        workout({ title: "B", status: "planned" }),
      ],
    }),
  ).toBe("2 sessions on this day. 1 logged, 1 still to log.");
});

it("reminds the athlete about today's open coach session", () => {
  expect(
    todayReminder({
      viewerIsSelf: true,
      athleteId: "ath",
      workouts: [workout({ title: "Push + pull foundations", status: "planned" })],
    }),
  ).toBe("Today your coach still has Push + pull foundations to log.");
});

it("marks a day by logged sessions over scheduled sessions", () => {
  expect(dayMark([])).toBe("");
  expect(dayMark([{ status: "skipped" }, { status: "skipped" }])).toBe("Skip");
  expect(dayMark([{ status: "completed" }, { status: "planned" }])).toBe("1/2");
});

it("compares recorded sets with the coach prescription", () => {
  const session = workout({
    _id: "w1",
    title: "Training day — week 6",
    status: "planned",
    items: [bench, row],
  });
  const rows = moveRows(session, [log("w1", [{ id: "bench", count: 2 }])], true);
  expect(rows.map((entry) => entry.state)).toEqual(["partial", "open"]);
  expect(rows[0].recordedLabel).toBe("2 of 4 sets recorded");
  expect(rows[0].notes).toBe("Pause on the chest");
  expect(rows[1].recordedLabel).toBe("0 of 3 sets recorded");
});

it("marks an exercise missing when the log skips it on a completed session", () => {
  const session = workout({
    _id: "w1",
    title: "Done",
    status: "completed",
    items: [bench, row],
  });
  const rows = moveRows(session, [log("w1", [{ id: "bench", count: 4 }])], true);
  expect(rows.map((entry) => entry.state)).toEqual(["logged", "missing"]);
});

it("sums recorded sets only against the assigned exercises", () => {
  const sessions = [
    workout({ _id: "w1", title: "A", status: "completed", items: [bench] }),
    workout({ _id: "w2", title: "B", status: "planned", items: [row] }),
  ];
  expect(setTally(sessions, [log("w1", [{ id: "bench", count: 4 }])])).toEqual({
    assigned: 7,
    recorded: 4,
    piecesAssigned: 0,
    piecesRecorded: 0,
  });
  expect(tallyLine(4, 7, true)).toBe("4 sets recorded · 7 sets assigned");
  expect(tallyLine(1, 1, true)).toBe("1 set recorded · 1 set assigned");
  expect(tallyLine(0, 7, false)).toBe("7 sets assigned");
});
