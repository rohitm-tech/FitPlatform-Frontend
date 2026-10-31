import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import {
  dayKey,
  foodLine,
  foodTotals,
  litres,
  useDailyLogs,
} from "../../queries/useDailyLog";
import type { DailyLog, Meal } from "../../queries/useDailyLog";

type RecordDate = { date: string };

export type LogTab = "food" | "water" | "sleep" | "body";

const TABS: [LogTab, string][] = [
  ["food", "Food"],
  ["water", "Water"],
  ["sleep", "Sleep"],
  ["body", "Body & mood"],
];

const MEALS: [Meal, string][] = [
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["dinner", "Dinner"],
  ["snack", "Snack"],
];

const RECOVERY: [string, string, number, number][] = [
  ["restingHeartRate", "Resting heart rate (bpm)", 25, 220],
  ["hrvMs", "HRV (ms)", 1, 400],
  ["steps", "Steps", 0, 200000],
  ["fatigue", "Fatigue (1–10)", 1, 10],
  ["soreness", "Soreness (1–10)", 1, 10],
];

const SCALES: ["mood" | "energy" | "stress", string, [string, string]][] = [
  ["mood", "Mood", ["Low", "Great"]],
  ["energy", "Energy", ["Drained", "Full"]],
  ["stress", "Stress", ["Calm", "High"]],
];

const WATCHES = [
  { id: "apple", label: "Apple Watch", source: "Apple Watch export" },
  { id: "wear", label: "Wear OS", source: "Wear OS export" },
  { id: "fitbit", label: "Fitbit", source: "Fitbit export" },
] as const;

function mealForNow(): Meal {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour >= 18 && hour < 23) return "dinner";
  return "snack";
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function errorText(err: any, fallback: string) {
  return err?.response?.data?.errors?.[0] || err?.response?.data?.message || fallback;
}

export function CheckInControl({ records }: { records?: RecordDate[] }) {
  const [open, setOpen] = useState(false);
  const today = dayKey();
  const known = Array.isArray(records);
  const done = known && records.some((record) => record.date === today);
  return (
    <>
      <button
        type="button"
        className={`checkin-button${known && !done ? " needs-checkin" : ""}`}
        onClick={() => setOpen(true)}
      >
        {known && done ? "Log more" : "Log today"}
      </button>
      {open && (
        <DailyLogDialog
          initialTab={known && !done ? "sleep" : "food"}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function DailyLogDialog({
  initialTab = "food",
  onClose,
}: {
  initialTab?: LogTab;
  onClose: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const today = dayKey();
  const [tab, setTab] = useState<LogTab>(initialTab);
  const [date, setDate] = useState(today);
  const logs = useDailyLogs(date, 1);
  const log = logs.data?.find((entry) => entry.date === date);

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const moveTab = (event: ReactKeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length][0];
    setTab(next);
    document.getElementById(`${titleId}-tab-${next}`)?.focus();
  };

  return createPortal(
    <div
      className="checkin-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        className="checkin-dialog log-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="checkin-dialog-head">
          <div>
            <h2 id={titleId}>Log your day</h2>
            <p>Everything is optional. Save what you know.</p>
          </div>
          <div className="log-head-actions">
            <div className="log-date">
              {date !== today && (
                <button type="button" className="log-text-button" onClick={() => setDate(today)}>
                  Back to today
                </button>
              )}
              <label htmlFor={`${titleId}-date`}>Day</label>
              <input
                id={`${titleId}-date`}
                className="fp-input"
                type="date"
                max={today}
                value={date}
                onChange={(event) => event.target.value && setDate(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="checkin-close"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="log-tabs" role="tablist" aria-label="What to log">
          {TABS.map(([key, label], index) => (
            <button
              key={key}
              id={`${titleId}-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls={`${titleId}-panel`}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          id={`${titleId}-panel`}
          role="tabpanel"
          aria-labelledby={`${titleId}-tab-${tab}`}
          className="log-panel"
        >
          {logs.isError ? (
            <p className="product-alert" role="alert">
              This day could not be loaded.{" "}
              <button type="button" onClick={() => logs.refetch()}>
                Try again
              </button>
            </p>
          ) : tab === "food" ? (
            <FoodTab date={date} log={log} loading={logs.isLoading} />
          ) : tab === "water" ? (
            <WaterTab date={date} log={log} loading={logs.isLoading} />
          ) : tab === "sleep" ? (
            <SleepTab date={date} />
          ) : (
            <BodyTab date={date} log={log} loading={logs.isLoading} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function useRefresh() {
  const queries = useQueryClient();
  return () => queries.invalidateQueries({ queryKey: ["daily-log"] });
}

function FoodTab({
  date,
  log,
  loading,
}: {
  date: string;
  log?: DailyLog;
  loading: boolean;
}) {
  const refresh = useRefresh();
  const [meal, setMeal] = useState<Meal>(mealForNow);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");
  const foods = log?.foods || [];
  const totals = foodTotals(foods);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const numbers = [calories, protein, carbs, fat].map(numberOrNull);
    if (numbers.some((value) => Number.isNaN(value) || (value != null && value < 0))) {
      setError("Calories and grams need to be numbers, or left blank.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/daily-log/${date}/foods`, {
        meal,
        name: name.trim(),
        calories: numbers[0],
        proteinG: numbers[1],
        carbsG: numbers[2],
        fatG: numbers[3],
      });
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      await refresh();
    } catch (err) {
      setError(errorText(err, "This food could not be saved. Your entry is still here."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      await api.delete(`/daily-log/${date}/foods/${id}`);
      await refresh();
    } catch (err) {
      toast.error(errorText(err, "Could not remove this entry"));
    } finally {
      setRemoving("");
    }
  };

  return (
    <>
      <form className="log-form" onSubmit={add}>
        <div className="log-segments" role="radiogroup" aria-label="Meal">
          {MEALS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={meal === key}
              onClick={() => setMeal(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="log-row log-row-food">
          <label>
            What you ate
            <input
              className="fp-input"
              required
              maxLength={120}
              placeholder="Paneer wrap"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Calories
            <input
              className="fp-input"
              inputMode="numeric"
              placeholder="kcal"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </label>
        </div>
        <details className="log-more">
          <summary>Protein, carbs and fat</summary>
          <div className="log-row log-row-macros">
            {[
              ["Protein (g)", protein, setProtein],
              ["Carbs (g)", carbs, setCarbs],
              ["Fat (g)", fat, setFat],
            ].map(([label, value, set]) => (
              <label key={label as string}>
                {label as string}
                <input
                  className="fp-input"
                  inputMode="decimal"
                  value={value as string}
                  onChange={(event) =>
                    (set as (value: string) => void)(event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </details>
        {error && (
          <p className="log-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-action" disabled={busy || !name.trim()}>
          {busy ? "Adding…" : "Add food"}
        </button>
      </form>
      <div className="log-summary" aria-live="polite">
        <strong>{loading ? "…" : `${totals.calories.toLocaleString()} kcal`}</strong>
        <span>
          {foods.length === 0
            ? "Nothing logged for this day"
            : foodLine(foods)}
        </span>
      </div>
      {foods.length > 0 && (
        <ul className="log-list">
          {MEALS.flatMap(([key, label]) =>
            foods
              .filter((food) => food.meal === key)
              .map((food) => (
                <li key={food._id}>
                  <span className="log-list-meal">{label}</span>
                  <span className="log-list-name">{food.name}</span>
                  <span className="log-list-value">
                    {food.calories != null ? `${Math.round(food.calories)} kcal` : "—"}
                  </span>
                  <button
                    type="button"
                    className="log-icon-button"
                    aria-label={`Remove ${food.name}`}
                    disabled={removing === food._id}
                    onClick={() => remove(food._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )),
          )}
        </ul>
      )}
    </>
  );
}

function WaterTab({
  date,
  log,
  loading,
}: {
  date: string;
  log?: DailyLog;
  loading: boolean;
}) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const total = log?.waterMl || 0;

  const change = async (ml: number) => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/daily-log/${date}/water`, { ml });
      await refresh();
      return true;
    } catch (err) {
      setError(errorText(err, "Water could not be saved. Try again."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="log-water">
      <div className="log-summary log-summary-large" aria-live="polite">
        <strong>{loading ? "…" : litres(total)}</strong>
        <span>{total === 0 ? "No water logged for this day" : `${total.toLocaleString()} ml so far`}</span>
      </div>
      <div className="log-water-quick">
        {[250, 500, 750].map((ml) => (
          <button
            key={ml}
            type="button"
            className="secondary-action"
            disabled={busy}
            onClick={() => change(ml)}
          >
            <Plus size={15} />
            {ml} ml
          </button>
        ))}
        <button
          type="button"
          className="secondary-action"
          aria-label="Remove 250 ml"
          disabled={busy || total === 0}
          onClick={() => change(-250)}
        >
          <Minus size={15} />
          250 ml
        </button>
      </div>
      <form
        className="log-row log-row-water"
        onSubmit={async (event) => {
          event.preventDefault();
          const ml = Math.round(Number(custom));
          if (!Number.isFinite(ml) || ml <= 0 || ml > 5000) {
            setError("Enter between 1 and 5000 ml.");
            return;
          }
          if (await change(ml)) setCustom("");
        }}
      >
        <label>
          Another amount (ml)
          <input
            className="fp-input"
            inputMode="numeric"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
        </label>
        <button className="secondary-action" disabled={busy || !custom}>
          Add
        </button>
      </form>
      {error && (
        <p className="log-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function BodyTab({
  date,
  log,
  loading,
}: {
  date: string;
  log?: DailyLog;
  loading: boolean;
}) {
  const refresh = useRefresh();
  const [weight, setWeight] = useState("");
  const [scales, setScales] = useState<Record<string, number | null>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWeight(log?.weightKg != null ? String(log.weightKg) : "");
    setScales({
      mood: log?.mood ?? null,
      energy: log?.energy ?? null,
      stress: log?.stress ?? null,
    });
    setNote(log?.note || "");
  }, [log?._id, log?.weightKg, log?.mood, log?.energy, log?.stress, log?.note, date]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const kg = numberOrNull(weight);
    if (Number.isNaN(kg) || (kg != null && (kg < 20 || kg > 400))) {
      setError("Weight needs to be between 20 and 400 kg, or left blank.");
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/daily-log/${date}`, {
        weightKg: kg,
        mood: scales.mood ?? null,
        energy: scales.energy ?? null,
        stress: scales.stress ?? null,
        note: note.trim(),
      });
      await refresh();
      toast.success("Saved");
    } catch (err) {
      setError(errorText(err, "This could not be saved. Your entries are still here."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="log-form" onSubmit={save}>
      <label className="log-weight">
        Body weight (kg)
        <input
          className="fp-input"
          inputMode="decimal"
          placeholder={loading ? "Loading…" : "Not recorded"}
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </label>
      {SCALES.map(([key, label, [low, high]]) => (
        <fieldset key={key} className="log-scale">
          <legend>{label}</legend>
          <div className="log-scale-row">
            <span aria-hidden="true">{low}</span>
            <div className="log-segments log-segments-scale">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scales[key] === value}
                  aria-label={`${label} ${value} of 5`}
                  onClick={() =>
                    setScales({
                      ...scales,
                      [key]: scales[key] === value ? null : value,
                    })
                  }
                >
                  {value}
                </button>
              ))}
            </div>
            <span aria-hidden="true">{high}</span>
          </div>
        </fieldset>
      ))}
      <label>
        Note
        <textarea
          className="fp-input"
          rows={2}
          maxLength={500}
          placeholder="Anything worth remembering about today"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      {error && (
        <p className="log-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-action" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function SleepTab({ date }: { date: string }) {
  const queries = useQueryClient();
  const [mode, setMode] = useState<"entry" | "import">("entry");
  const [watch, setWatch] = useState<(typeof WATCHES)[number]["id"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [json, setJson] = useState("");
  const [source, setSource] = useState("Watch export");
  const [consent, setConsent] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const payload: Record<string, number> = {};
    if (hours.trim() || minutes.trim()) {
      const h = Number(hours || 0);
      const m = Number(minutes || 0);
      if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0 || m > 59 || h > 24) {
        setError("Sleep needs hours from 0 to 24 and minutes from 0 to 59.");
        return;
      }
      payload.sleepMinutes = Math.round(h * 60 + m);
    }
    for (const [key, value] of Object.entries(values)) {
      if (value !== "") payload[key] = Number(value);
    }
    if (!Object.keys(payload).length) {
      setError("Enter at least one measurement.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/performance/daily", { date, ...payload, notes });
      toast.success("Recovery saved");
      setHours("");
      setMinutes("");
      setValues({});
      setNotes("");
      await queries.invalidateQueries({ queryKey: ["performance"] });
    } catch (err) {
      setError(errorText(err, "Could not save this check-in. Your entries are still here."));
    } finally {
      setBusy(false);
    }
  };

  const importData = async () => {
    setError("");
    setBusy(true);
    try {
      const parsed = JSON.parse(json);
      if (parsed.sleep?.summary || parsed.summary?.totalMinutesAsleep != null) {
        await api.post("/performance/import/fitbit", {
          ...parsed,
          consent,
          date: parsed.sleep?.[0]?.dateOfSleep || date,
        });
      } else {
        await api.post("/performance/import", {
          consent,
          sourceLabel: source,
          records: Array.isArray(parsed) ? parsed : parsed.records,
        });
      }
      toast.success("Export imported");
      setJson("");
      await queries.invalidateQueries({ queryKey: ["performance"] });
    } catch (err) {
      setError(errorText(err, "This file could not be imported. Use a daily JSON export."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="log-subtoggle">
        <button
          type="button"
          aria-pressed={mode === "entry"}
          onClick={() => setMode("entry")}
        >
          Enter by hand
        </button>
        <button
          type="button"
          aria-pressed={mode === "import"}
          onClick={() => setMode("import")}
        >
          Import from a watch
        </button>
      </div>
      {error && (
        <p className="log-error" role="alert">
          {error}
        </p>
      )}
      {mode === "entry" ? (
        <form className="checkin-form" onSubmit={save}>
          <fieldset className="log-sleep">
            <legend>Sleep</legend>
            <label>
              <input
                className="fp-input"
                inputMode="numeric"
                aria-label="Sleep hours"
                placeholder="7"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
              <span>h</span>
            </label>
            <label>
              <input
                className="fp-input"
                inputMode="numeric"
                aria-label="Sleep minutes"
                placeholder="30"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
              <span>min</span>
            </label>
          </fieldset>
          {RECOVERY.map(([key, label, min, max]) => (
            <label key={key}>
              {label}
              <input
                className="fp-input"
                type="number"
                min={min}
                max={max}
                placeholder="Not recorded"
                value={values[key] || ""}
                onChange={(event) =>
                  setValues({ ...values, [key]: event.target.value })
                }
              />
            </label>
          ))}
          <label className="checkin-notes">
            Notes
            <textarea
              className="fp-input"
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button className="primary-action" disabled={busy}>
            {busy ? "Saving…" : "Save recovery"}
          </button>
        </form>
      ) : (
        <div className="checkin-import">
          <p>Bring an export from a watch. This does not pair the device.</p>
          <div className="watch-row">
            {WATCHES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={watch === item.id ? "is-selected" : ""}
                onClick={() => {
                  setWatch(item.id);
                  setSource(item.source);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="chart-caption">
            {watch
              ? `${source} is saved as an import, not a live connection.`
              : "Apple Watch, Wear OS and Fitbit need an exported file. Live pairing is not connected."}
          </p>
          <label>
            Source label
            <input
              className="fp-input"
              maxLength={80}
              value={source}
              onChange={(event) => setSource(event.target.value)}
            />
          </label>
          <label className="upload-file">
            Choose a JSON export
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file && file.size <= 1024 * 1024) setJson(await file.text());
                else toast.error("Use a JSON file under 1 MB");
              }}
            />
          </label>
          <label>
            Paste JSON
            <textarea
              className="fp-input"
              rows={5}
              value={json}
              placeholder="Daily metrics or a Fitbit sleep summary"
              onChange={(event) => setJson(event.target.value)}
            />
          </label>
          <label className="consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I agree to store this export for training guidance.
          </label>
          <button
            type="button"
            className="primary-action"
            disabled={busy || !json || !consent || !source.trim()}
            onClick={importData}
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      )}
    </>
  );
}
