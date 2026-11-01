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

const MEAL_ORDER = ["breakfast", "snack", "lunch", "dinner", "supper"];

function mealGroups(foods: FoodEntry[]) {
  const groups = new Map<string, FoodEntry[]>();
  for (const food of foods) {
    const meal = food.meal || "Food";
    const list = groups.get(meal) || [];
    list.push(food);
    groups.set(meal, list);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const rank = (meal: string) => {
        const index = MEAL_ORDER.indexOf(meal.toLowerCase());
        return index === -1 ? MEAL_ORDER.length : index;
      };
      return rank(a[0]) - rank(b[0]);
    })
    .map(([meal, items]) => ({ meal, items }));
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
  const calories = showFood ? calorieLabel(foods) : null;
  const water = showWater && log?.waterMl ? litres(log.waterMl) : null;
  const sleep = showRecovery ? sleepLabel(recovery?.sleepMinutes) : null;
  const steps = showRecovery && recovery?.steps != null ? `${recovery.steps.toLocaleString("en-IN")} steps` : null;
  const facts = [
    calories ? { label: "Food", value: calories } : null,
    water ? { label: "Water", value: water } : null,
    sleep ? { label: "Sleep", value: sleep } : null,
    steps ? { label: "Steps", value: steps.replace(" steps", "") } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const recoveryExtra = showRecovery && recovery
    ? [
        recovery.hrvMs != null ? { label: "HRV", value: `${recovery.hrvMs} ms` } : null,
        recovery.restingHeartRate != null ? { label: "Resting heart rate", value: `${recovery.restingHeartRate} bpm` } : null,
        recovery.fatigue != null ? { label: "Fatigue", value: `${recovery.fatigue} of 10` } : null,
        recovery.soreness != null ? { label: "Soreness", value: `${recovery.soreness} of 10` } : null,
        recovery.notes ? { label: "Note", value: recovery.notes } : null,
      ].filter(Boolean) as { label: string; value: string }[]
    : [];
  const bodyLines = showBody
    ? [
        log?.weightKg != null ? { label: "Weight", value: `${log.weightKg} kg` } : null,
        log?.mood != null ? { label: "Mood", value: `${log.mood} of 5` } : null,
        log?.energy != null ? { label: "Energy", value: `${log.energy} of 5` } : null,
        log?.stress != null ? { label: "Stress", value: `${log.stress} of 5` } : null,
        log?.note ? { label: "Note", value: log.note } : null,
      ].filter(Boolean) as { label: string; value: string }[]
    : [];

  return (
    <article className="log-day">
      <header>
        <h3>{labelDate(date)}</h3>
        {facts.length > 0 && (
          <dl className="log-day-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>
      {showFood &&
        mealGroups(foods).map((group) => (
          <section key={group.meal} className="log-meal">
            <h4>{group.meal}</h4>
            <ul>
              {group.items.map((food) => {
                const line = foodText(food);
                return (
                  <li key={food._id}>
                    <span>{line.name}</span>
                    <span className={food.calories == null ? "log-missing" : "log-entry-value"}>{line.value}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      {showWater && !!log?.waterMl && (
        <section className="log-meal">
          <h4>Water</h4>
          <ul>
            <li>
              <span>{litres(log.waterMl)}</span>
              <span className="log-entry-value">{log.waterMl.toLocaleString("en-IN")} ml</span>
            </li>
          </ul>
        </section>
      )}
      {bodyLines.length > 0 && (
        <section className="log-meal">
          <h4>Body</h4>
          <ul>
            {bodyLines.map((line) => (
              <li key={line.label}>
                <span>{line.label}</span>
                <span className="log-entry-value">{line.value}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {showRecovery && recovery && (recovery.source === "demo" || recovery.sourceLabel) && recoveryExtra.length === 0 && (
        <p className="log-source">{recovery.source === "demo" ? "Demo reading" : recovery.sourceLabel}</p>
      )}
      {showRecovery && recovery && recoveryExtra.length > 0 && (
        <section className="log-meal">
          <h4>Recovery</h4>
          <ul>
            {recoveryExtra.map((line) => (
              <li key={line.label}>
                <span>{line.label}</span>
                <span className="log-entry-value">{line.value}</span>
              </li>
            ))}
            {(recovery.source === "demo" || recovery.sourceLabel) && (
              <li>
                <span>Source</span>
                <span className="log-entry-value">{recovery.source === "demo" ? "Demo" : recovery.sourceLabel}</span>
              </li>
            )}
          </ul>
        </section>
      )}
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
