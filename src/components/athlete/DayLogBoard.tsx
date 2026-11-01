import { useMemo, useState } from "react";
import { dayKey, foodTotals, litres, useDailyLogs } from "../../queries/useDailyLog";
import type { DailyLog, FoodEntry } from "../../queries/useDailyLog";
import { usePerformance } from "../../queries/usePerformance";

type Kind = "all" | "food" | "water" | "body" | "recovery" | "cumulative";
type Range = 7 | 30 | 90 | 365;

type RecoveryRow = {
  date: string;
  source?: string;
  sourceLabel?: string;
  sleepMinutes?: number | null;
  restingHeartRate?: number | null;
  hrvMs?: number | null;
  steps?: number | null;
  fatigue?: number | null;
  soreness?: number | null;
  notes?: string;
  updatedAt?: string;
};

const RANGES: [Range, string][] = [
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
  [365, "Year"],
];

const KINDS: [Kind, string][] = [
  ["all", "Everything"],
  ["food", "Food"],
  ["water", "Water"],
  ["body", "Body"],
  ["recovery", "Recovery"],
  ["cumulative", "Cumulative"],
];

const RECOVERY_FIELDS = [
  "sleepMinutes",
  "restingHeartRate",
  "hrvMs",
  "steps",
  "fatigue",
  "soreness",
  "notes",
] as const;

function shiftKey(key: string, delta: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return dayKey(date);
}

function labelDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function sleepLabel(minutes?: number | null) {
  if (minutes == null) return null;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m sleep`;
}

function calorieLabel(foods: FoodEntry[]) {
  if (!foods.length) return null;
  const known = foods.filter((food) => food.calories != null);
  if (!known.length) return "calories not added";
  const total = Math.round(foodTotals(foods).calories);
  const estimated = known.some((food) => food.estimated);
  const stated = known.some((food) => !food.estimated);
  if (estimated && !stated) return `about ${total.toLocaleString("en-IN")} kcal`;
  if (estimated) return `${total.toLocaleString("en-IN")} kcal, some estimated`;
  return `${total.toLocaleString("en-IN")} kcal`;
}

function foodText(food: FoodEntry) {
  const amount = food.quantity ? `${food.name} · ${food.quantity}` : food.name;
  if (food.calories == null) return { name: amount, value: "Needs a quantity" };
  const kcal = `${Math.round(food.calories).toLocaleString("en-IN")} kcal`;
  return { name: amount, value: food.estimated ? `about ${kcal}` : kcal };
}

function mergeRecovery(rows: RecoveryRow[]) {
  const ordered = [...rows].sort(
    (a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime(),
  );
  const merged: RecoveryRow = { date: rows[0]?.date || "" };
  for (const row of ordered) {
    for (const field of RECOVERY_FIELDS) {
      if (row[field] != null && row[field] !== "") merged[field] = row[field] as never;
    }
    if (row.sourceLabel || row.source) merged.sourceLabel = row.sourceLabel || row.source;
    if (row.source === "demo") merged.source = "demo";
  }
  return merged;
}

function recoveryLines(row: RecoveryRow) {
  return [
    sleepLabel(row.sleepMinutes),
    row.hrvMs != null ? `HRV ${row.hrvMs} ms` : null,
    row.restingHeartRate != null ? `Resting HR ${row.restingHeartRate}` : null,
    row.steps != null ? `${row.steps.toLocaleString("en-IN")} steps` : null,
    row.fatigue != null ? `Fatigue ${row.fatigue}/10` : null,
    row.soreness != null ? `Soreness ${row.soreness}/10` : null,
    row.notes || null,
  ].filter(Boolean) as string[];
}

export function DayLogBoard() {
  const today = dayKey();
  const [range, setRange] = useState<Range>(30);
  const [kind, setKind] = useState<Kind>("all");
  const logs = useDailyLogs(today, range);
  const performance = usePerformance();
  const from = shiftKey(today, -(range - 1));

  const days = useMemo(() => {
    const byDate = new Map((logs.data || []).map((log) => [log.date, log]));
    const recoveryByDate = new Map<string, RecoveryRow[]>();
    for (const record of (performance.data?.records || []) as RecoveryRow[]) {
      if (record.date < from || record.date > today) continue;
      const list = recoveryByDate.get(record.date) || [];
      list.push(record);
      recoveryByDate.set(record.date, list);
    }
    const keys = new Set<string>([...byDate.keys(), ...recoveryByDate.keys()]);
    return [...keys]
      .filter((date) => date >= from && date <= today)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => ({
        date,
        log: byDate.get(date),
        recovery: recoveryByDate.get(date) ? mergeRecovery(recoveryByDate.get(date)!) : null,
      }));
  }, [logs.data, performance.data, from, today]);

  const visible = days.filter(({ log, recovery }) => {
    if (kind === "food") return !!log?.foods.length;
    if (kind === "water") return (log?.waterMl || 0) > 0;
    if (kind === "body") return !!(log && (log.weightKg != null || log.mood != null || log.energy != null || log.stress != null || log.note));
    if (kind === "recovery") return !!recovery && recoveryLines(recovery).length > 0;
    if (kind === "cumulative") return false;
    return !!(log?.foods.length || log?.waterMl || log?.weightKg != null || log?.mood != null || log?.energy != null || log?.stress != null || log?.note || (recovery && recoveryLines(recovery).length));
  });

  const loading = logs.isLoading || performance.isLoading;
  const failed = logs.isError || performance.isError;

  return (
    <section className="work-panel log-board">
      <div className="section-heading">
        <h2>Your logs</h2>
        <span className="status-pill">Food, water, body, recovery</span>
      </div>
      <div className="panel-body">
        <div className="log-board-filters">
          <div className="platform-tabs" role="tablist" aria-label="What to show">
            {KINDS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={kind === key}
                onClick={() => setKind(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="platform-tabs" role="tablist" aria-label="How far back">
            {RANGES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={range === key}
                onClick={() => setRange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {failed ? (
          <p className="product-alert" role="alert">
            The log could not be loaded.{" "}
            <button type="button" onClick={() => { logs.refetch(); performance.refetch(); }}>
              Retry
            </button>
          </p>
        ) : loading ? (
          <p>Loading your logs…</p>
        ) : kind === "cumulative" ? (
          <Cumulative days={days} range={range} />
        ) : visible.length === 0 ? (
          <p className="small-note">Nothing in this filter for the last {range === 365 ? "year" : `${range} days`}.</p>
        ) : (
          <div className="log-days">
            {visible.map(({ date, log, recovery }) => (
              <DayCard key={date} date={date} log={log} recovery={recovery} kind={kind} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DayCard({
  date,
  log,
  recovery,
  kind,
}: {
  date: string;
  log?: DailyLog;
  recovery: RecoveryRow | null;
  kind: Kind;
}) {
  const showFood = kind === "all" || kind === "food";
  const showWater = kind === "all" || kind === "water";
  const showBody = kind === "all" || kind === "body";
  const showRecovery = kind === "all" || kind === "recovery";
  const foods = log?.foods || [];
  const meta = [
    showFood ? calorieLabel(foods) : null,
    showWater && log?.waterMl ? litres(log.waterMl) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="log-day">
      <header>
        <h3>{labelDate(date)}</h3>
        {meta && <span className="log-day-meta">{meta}</span>}
      </header>
      <ul className="log-entries">
        {showFood &&
          foods.map((food) => {
            const line = foodText(food);
            return (
              <li key={food._id}>
                <span className="log-entry-kind">{food.meal}</span>
                <span className={food.calories == null ? "log-missing" : ""}>{line.name}</span>
                <span className="log-entry-value">{line.value}</span>
              </li>
            );
          })}
        {showWater && !!log?.waterMl && (
          <li>
            <span className="log-entry-kind">Water</span>
            <span>{litres(log.waterMl)}</span>
            <span className="log-entry-value">{log.waterMl.toLocaleString("en-IN")} ml</span>
          </li>
        )}
        {showBody && log?.weightKg != null && (
          <li>
            <span className="log-entry-kind">Weight</span>
            <span>{log.weightKg} kg</span>
            <span />
          </li>
        )}
        {showBody && log?.mood != null && (
          <li>
            <span className="log-entry-kind">Mood</span>
            <span>{log.mood}/5</span>
            <span className="log-entry-value">
              {[log.energy != null ? `Energy ${log.energy}/5` : null, log.stress != null ? `Stress ${log.stress}/5` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </li>
        )}
        {showBody && log?.mood == null && (log?.energy != null || log?.stress != null) && (
          <li>
            <span className="log-entry-kind">Body</span>
            <span>
              {[log?.energy != null ? `Energy ${log.energy}/5` : null, log?.stress != null ? `Stress ${log.stress}/5` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span />
          </li>
        )}
        {showBody && log?.note && (
          <li>
            <span className="log-entry-kind">Note</span>
            <span>{log.note}</span>
            <span />
          </li>
        )}
        {showRecovery && recovery && recoveryLines(recovery).length > 0 && (
          <li>
            <span className="log-entry-kind">Recovery</span>
            <span>
              {recoveryLines(recovery).join(" · ")}
              {recovery.source === "demo" ? " · Demo" : ""}
            </span>
            <span className="log-entry-value">{recovery.sourceLabel || ""}</span>
          </li>
        )}
      </ul>
    </article>
  );
}

function Cumulative({
  days,
  range,
}: {
  days: { date: string; log?: DailyLog; recovery: RecoveryRow | null }[];
  range: Range;
}) {
  const foods = days.flatMap((day) => day.log?.foods || []);
  const known = foods.filter((food) => food.calories != null);
  const estimated = known.filter((food) => food.estimated);
  const missing = foods.length - known.length;
  const calories = Math.round(foodTotals(foods).calories);
  const waterDays = days.filter((day) => (day.log?.waterMl || 0) > 0);
  const water = waterDays.reduce((sum, day) => sum + (day.log?.waterMl || 0), 0);
  const weights = days.filter((day) => day.log?.weightKg != null);
  const sleep = days
    .map((day) => day.recovery?.sleepMinutes)
    .filter((minutes): minutes is number => minutes != null);
  const steps = days.reduce((sum, day) => sum + (day.recovery?.steps || 0), 0);
  const stepDays = days.filter((day) => day.recovery?.steps != null).length;
  const avgSleep = sleep.length
    ? sleepLabel(Math.round(sleep.reduce((sum, minutes) => sum + minutes, 0) / sleep.length))
    : null;

  return (
    <div>
      <div className="log-kpis">
        <div className="platform-kpi">
          <strong>{known.length ? calories.toLocaleString("en-IN") : "—"}</strong>
          <span>
            {known.length
              ? `kcal logged${estimated.length ? ` · ${estimated.length} estimated` : ""}`
              : "No calories yet"}
          </span>
        </div>
        <div className="platform-kpi">
          <strong>{water ? litres(water) : "—"}</strong>
          <span>
            {waterDays.length
              ? `water · ${litres(Math.round(water / waterDays.length))} on logged days`
              : "No water logged"}
          </span>
        </div>
        <div className="platform-kpi">
          <strong>{foods.length || "—"}</strong>
          <span>
            {foods.length
              ? `foods${missing ? ` · ${missing} still need a quantity` : ""}`
              : "No food logged"}
          </span>
        </div>
        <div className="platform-kpi">
          <strong>{avgSleep || (stepDays ? steps.toLocaleString("en-IN") : "—")}</strong>
          <span>
            {avgSleep
              ? `average sleep${stepDays ? ` · ${steps.toLocaleString("en-IN")} steps` : ""}`
              : stepDays
                ? "steps"
                : "No recovery readings"}
          </span>
        </div>
      </div>
      <p className="small-note log-cumulative-note">
        {range === 365 ? "This year" : `Last ${range} days`}. Totals count only what was logged.
        {weights.length
          ? ` Latest weight ${weights[0].log?.weightKg} kg.`
          : ""}
        {estimated.length ? " Estimated calories are approximate." : ""}
        {missing ? " Foods without a quantity are left out of the calorie total." : ""}
      </p>
    </div>
  );
}
