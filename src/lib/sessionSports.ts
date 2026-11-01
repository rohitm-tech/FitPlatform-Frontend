import type { SessionKind, StationMetric, WorkoutItem } from "../types/domain";
import { SPORTS, type Sport } from "../pages/discover/catalog";

export const SPORT_KIND: Record<Sport, SessionKind> = {
  Strength: "strength",
  Calisthenics: "strength",
  Swimming: "swim",
  Running: "endurance",
  Cycling: "endurance",
  Triathlon: "endurance",
  HYROX: "station",
  CrossFit: "station",
  Boxing: "rounds",
  "Martial Arts": "rounds",
  Yoga: "practice",
  Pilates: "practice",
  Dance: "practice",
  Tennis: "practice",
  Badminton: "practice",
  Basketball: "practice",
  Football: "practice",
  Cricket: "practice",
  Squash: "practice",
  Climbing: "practice",
};

export const SWIM_STROKES = [
  "Freestyle",
  "Backstroke",
  "Breaststroke",
  "Butterfly",
  "Medley",
  "Kick",
  "Drill",
];

export const HYROX_STATIONS: { name: string; metric: StationMetric; amount: number }[] = [
  { name: "1 km run", metric: "distance", amount: 1000 },
  { name: "SkiErg", metric: "distance", amount: 1000 },
  { name: "Sled push", metric: "distance", amount: 50 },
  { name: "Sled pull", metric: "distance", amount: 50 },
  { name: "Burpee broad jumps", metric: "distance", amount: 80 },
  { name: "Rowing", metric: "distance", amount: 1000 },
  { name: "Farmers carry", metric: "distance", amount: 200 },
  { name: "Sandbag lunges", metric: "distance", amount: 100 },
  { name: "Wall balls", metric: "reps", amount: 100 },
];

const MEASUREMENT_HINT: Record<SessionKind, string> = {
  strength: "Sets, reps, load and rest, from the exercise library.",
  swim: "Repeats, distance in metres, stroke, rest, and an optional pace in seconds per 100 m.",
  endurance: "Distance, time, or both. Repeats cover intervals, with rest between them.",
  station: "Each station is reps, distance or time, with an optional load.",
  rounds: "Rounds, time on, and rest between rounds.",
  practice: "A timed block: class, drill, match or skill work, plus an optional effort score.",
};

export function kindForSport(sport: string): SessionKind {
  return SPORT_KIND[sport as Sport] || "practice";
}

export function measurementHint(sport: string) {
  if (sport === "HYROX") {
    return "HYROX stations and the runs between them. Each line is reps, distance or time.";
  }
  return MEASUREMENT_HINT[kindForSport(sport)];
}

export function isGymSession(workout: { sport?: string; items: { kind?: string }[] }) {
  if (workout.sport && kindForSport(workout.sport) !== "strength") return false;
  return workout.items.every((item) => !item.kind || item.kind === "strength");
}

export function formatDistance(meters?: number | null) {
  if (meters == null || meters <= 0) return "";
  if (meters >= 1000 && meters % 100 === 0) {
    const km = meters / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null || seconds <= 0) return "";
  const total = Math.round(seconds);
  if (total < 60) return `${total} sec`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return sec ? `${min} min ${sec} sec` : `${min} min`;
}

export function pieceName(item: {
  label?: string;
  exerciseId?: { name?: string } | string | null;
}) {
  if (item.label?.trim()) return item.label.trim();
  if (!item.exerciseId || typeof item.exerciseId === "string") return "Exercise";
  return item.exerciseId.name || "Exercise";
}

export function formatPrescription(item: {
  kind?: string;
  sets?: number | null;
  reps?: number | null;
  targetWeightKg?: number | null;
  restSec?: number | null;
  distanceM?: number | null;
  durationSec?: number | null;
  paceSec?: number | null;
  stroke?: string;
  metric?: string;
  effort?: number | null;
}) {
  const kind = item.kind || "strength";
  if (kind === "strength") {
    const weight = item.targetWeightKg != null ? ` · ${item.targetWeightKg} kg` : "";
    return `${item.sets ?? 0} × ${item.reps ?? 0}${weight}`;
  }
  const rest = item.restSec ? ` · rest ${item.restSec}s` : "";
  if (kind === "swim") {
    const pace = item.paceSec ? ` · ${item.paceSec}s / 100 m` : "";
    return `${item.sets ?? 1} × ${item.distanceM ?? 0} m${item.stroke ? ` ${item.stroke}` : ""}${pace}${rest}`;
  }
  if (kind === "endurance") {
    const work = [formatDistance(item.distanceM), formatDuration(item.durationSec)]
      .filter(Boolean)
      .join(" · ");
    const repeats = (item.sets ?? 1) > 1 ? `${item.sets} × ` : "";
    return `${repeats}${work || "Effort"}${rest}`;
  }
  if (kind === "station") {
    const amount =
      item.metric === "reps"
        ? `${item.reps ?? 0} reps`
        : item.metric === "distance"
          ? formatDistance(item.distanceM) || "distance"
          : formatDuration(item.durationSec) || "time";
    const load = item.targetWeightKg ? ` · ${item.targetWeightKg} kg` : "";
    return `${amount}${load}${rest}`;
  }
  if (kind === "rounds") {
    return `${item.sets ?? 1} × ${formatDuration(item.durationSec) || "work"} on${rest}`;
  }
  const effort = item.effort ? ` · effort ${item.effort}/10` : "";
  return `${formatDuration(item.durationSec) || "Practice"}${effort}`;
}

export function formatLoggedSet(
  set: { reps?: number; weightKg?: number; distanceM?: number | null; durationSec?: number | null },
  kind?: string,
) {
  if (!kind || kind === "strength") {
    return `${set.reps ?? 0} reps at ${set.weightKg ?? 0} kg`;
  }
  const bits: string[] = [];
  if (set.reps && kind !== "practice") bits.push(kind === "rounds" ? `${set.reps} rounds` : kind === "swim" ? `${set.reps} repeats` : `${set.reps} reps`);
  if (set.distanceM) bits.push(formatDistance(set.distanceM));
  if (set.durationSec) bits.push(formatDuration(set.durationSec));
  if (set.weightKg && kind === "station") bits.push(`${set.weightKg} kg`);
  return bits.join(" · ") || "Logged";
}

export function sessionCountLabel(count: number, gym: boolean) {
  if (gym) return count === 1 ? "1 exercise" : `${count} exercises`;
  return count === 1 ? "1 piece" : `${count} pieces`;
}

export { SPORTS };
export type { WorkoutItem };
