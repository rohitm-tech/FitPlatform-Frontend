import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLogWorkout } from "../../queries/useAthlete";
import type { SessionKind, Workout, WorkoutItem } from "../../types/domain";
import { formatPrescription, kindForSport, pieceName } from "../../lib/sessionSports";

type Row = {
  label: string;
  kind: SessionKind;
  metric: string;
  reps: number;
  distanceM: number;
  durationSec: number;
  weightKg: number;
  prescription: string;
  notes: string;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function sessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return today();
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return key > today() ? today() : key;
}

function rowsFrom(workout: Workout): Row[] {
  const fallback = kindForSport(workout.sport || "Strength");
  return workout.items.map((item) => ({
    label: pieceName(item),
    kind: item.kind || fallback,
    metric: item.metric || "",
    reps:
      item.kind === "station" && item.metric === "reps"
        ? item.reps || 0
        : item.kind === "rounds" || item.kind === "swim" || item.kind === "endurance"
          ? item.sets || 1
          : 0,
    distanceM: item.distanceM || 0,
    durationSec: item.durationSec || 0,
    weightKg: item.targetWeightKg || 0,
    prescription: formatPrescription(item),
    notes: item.notes?.trim() || "",
  }));
}

function fieldsFor(item: WorkoutItem): "swim" | "endurance" | "station" | "rounds" | "practice" {
  if (item.kind === "swim" || item.kind === "endurance" || item.kind === "station" || item.kind === "rounds") {
    return item.kind;
  }
  return "practice";
}

export function SportSessionLog({
  workout,
  athleteId,
}: {
  workout: Workout;
  athleteId: string | undefined;
}) {
  const navigate = useNavigate();
  const log = useLogWorkout(athleteId);
  const [rows, setRows] = useState(() => rowsFrom(workout));
  const [date, setDate] = useState(sessionDate(workout.date));
  const [duration, setDuration] = useState(
    Math.max(1, Math.round(workout.items.reduce((sum, item) => sum + (item.durationSec || 0), 0) / 60) || 30),
  );
  const [effort, setEffort] = useState(6);
  const [pain, setPain] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const sport = workout.sport || "Training";

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!rows.length) {
      setError("This session has no pieces to log.");
      return;
    }
    try {
      await log.mutateAsync({
        workoutId: workout._id,
        date: new Date(date + "T12:00:00").toISOString(),
        items: rows.map((row) => ({
          label: row.label,
          kind: row.kind,
          sets: [
            {
              reps: row.reps || 0,
              weightKg: row.weightKg || 0,
              ...(row.distanceM > 0 ? { distanceM: row.distanceM } : {}),
              ...(row.durationSec > 0 ? { durationSec: row.durationSec } : {}),
            },
          ],
        })),
        durationMin: duration,
        perceivedEffort: effort,
        painFlag: pain,
        notes,
      });
      navigate("/athlete/history");
    } catch (e: any) {
      setError(e.response?.data?.message || "Your session could not be saved. Your entries are still here.");
    }
  };

  return (
    <div className="product-page logger-page">
      <Link className="page-back" to="/athlete/history">
        <ArrowLeft size={16} />
        Training calendar
      </Link>
      <form onSubmit={submit}>
        {error && (
          <div className="form-feedback" role="alert">
            {error}
          </div>
        )}
        <div className="two-column-page">
          <section className="page-section">
            <h2>{workout.title}</h2>
            <p>
              {sport}. Record what you actually did. Targets from your coach are filled in so you can adjust them.
            </p>
            <div className="mt-5">
              {rows.map((row, index) => (
                <article className="logger-exercise" key={`${row.label}-${index}`}>
                  <h3>{row.label}</h3>
                  <p className="section-note">{row.prescription}</p>
                  {row.notes && <p className="section-note">{row.notes}</p>}
                  <div className="field-row">
                    {fieldsFor(workout.items[index] || { sets: 0 }) === "swim" && (
                      <>
                        <NumberField
                          label="Repeats completed"
                          value={row.reps}
                          min={0}
                          max={100}
                          onChange={(value) => update(index, { reps: value })}
                        />
                        <NumberField
                          label="Distance each (m)"
                          value={row.distanceM}
                          min={0}
                          max={10000}
                          onChange={(value) => update(index, { distanceM: value })}
                        />
                        <NumberField
                          label="Time for one repeat (sec)"
                          value={row.durationSec}
                          min={0}
                          max={3600}
                          onChange={(value) => update(index, { durationSec: value })}
                        />
                      </>
                    )}
                    {fieldsFor(workout.items[index] || { sets: 0 }) === "endurance" && (
                      <>
                        {(workout.items[index]?.sets || 1) > 1 && (
                          <NumberField
                            label="Repeats completed"
                            value={row.reps}
                            min={0}
                            max={100}
                            onChange={(value) => update(index, { reps: value })}
                          />
                        )}
                        <NumberField
                          label="Distance (m)"
                          value={row.distanceM}
                          min={0}
                          max={200000}
                          onChange={(value) => update(index, { distanceM: value })}
                        />
                        <NumberField
                          label="Duration (min)"
                          value={row.durationSec ? Math.round(row.durationSec / 60) : 0}
                          min={0}
                          max={1440}
                          onChange={(value) => update(index, { durationSec: value * 60 })}
                        />
                      </>
                    )}
                    {fieldsFor(workout.items[index] || { sets: 0 }) === "station" && (
                      <>
                        {row.metric === "reps" && (
                          <NumberField
                            label="Reps completed"
                            value={row.reps}
                            min={0}
                            max={1000}
                            onChange={(value) => update(index, { reps: value })}
                          />
                        )}
                        {row.metric === "distance" && (
                          <NumberField
                            label="Distance (m)"
                            value={row.distanceM}
                            min={0}
                            max={100000}
                            onChange={(value) => update(index, { distanceM: value })}
                          />
                        )}
                        {row.metric === "time" && (
                          <NumberField
                            label="Time (sec)"
                            value={row.durationSec}
                            min={0}
                            max={7200}
                            onChange={(value) => update(index, { durationSec: value })}
                          />
                        )}
                        <NumberField
                          label="Load (kg)"
                          value={row.weightKg}
                          min={0}
                          max={500}
                          onChange={(value) => update(index, { weightKg: value })}
                        />
                      </>
                    )}
                    {fieldsFor(workout.items[index] || { sets: 0 }) === "rounds" && (
                      <>
                        <NumberField
                          label="Rounds completed"
                          value={row.reps}
                          min={0}
                          max={30}
                          onChange={(value) => update(index, { reps: value })}
                        />
                        <NumberField
                          label="Work each round (min)"
                          value={row.durationSec ? row.durationSec / 60 : 0}
                          min={0}
                          max={30}
                          step="0.5"
                          onChange={(value) => update(index, { durationSec: Math.round(value * 60) })}
                        />
                      </>
                    )}
                    {fieldsFor(workout.items[index] || { sets: 0 }) === "practice" && (
                      <NumberField
                        label="Duration (min)"
                        value={row.durationSec ? Math.round(row.durationSec / 60) : 0}
                        min={1}
                        max={240}
                        onChange={(value) => update(index, { durationSec: value * 60 })}
                      />
                    )}
                  </div>
                </article>
              ))}
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
            <label className="fp-label mt-6" htmlFor="sport-effort">
              Perceived effort · {effort}/10
            </label>
            <input
              id="sport-effort"
              type="range"
              min={1}
              max={10}
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value))}
              className="w-full"
            />
            <p className="section-note">1 is very easy. 10 is your maximum effort.</p>
            <label className="athlete-choice mt-4">
              <input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} />
              I felt pain or discomfort
            </label>
            {pain && (
              <p className="field-error">Stop painful work and seek a qualified professional’s advice.</p>
            )}
            <label className="fp-label mt-5" htmlFor="sport-notes">
              Session notes <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="sport-notes"
              className="fp-input"
              rows={4}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What felt good? What was difficult?"
            />
            <div className="logger-actions">
              <Link className="secondary-action" to="/athlete/history">
                Cancel
              </Link>
              <button className="primary-action" type="submit" disabled={log.isPending}>
                {log.isPending ? "Saving session…" : "Save session"}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="numeric-field">
      {label}
      <input
        aria-label={label}
        className="fp-input"
        type="number"
        min={min}
        max={max}
        step={step || 1}
        required
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
