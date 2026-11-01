import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { CheckInControl } from "../../components/athlete/CheckInDialog";
import { DayLogBoard } from "../../components/athlete/DayLogBoard";
import { dayKey } from "../../queries/useDailyLog";
import toast from "react-hot-toast";
import { usePerformance } from "../../queries/usePerformance";
import { api } from "../../services/api";
export default function RecoveryPage() {
  const { data, isLoading, isError, refetch } = usePerformance();
  const queries = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [importError, setImportError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);
  const [consent, setConsent] = useState(false);
  const [date, setDate] = useState(dayKey());
  const [values, setValues] = useState<Record<string, string>>({
    sleepMinutes: "",
    restingHeartRate: "",
    hrvMs: "",
    steps: "",
    fatigue: "",
    soreness: "",
  });
  const [json, setJson] = useState("");
  const [source, setSource] = useState("Watch export");
  const [notes, setNotes] = useState("");
  const refresh = () =>
    queries.invalidateQueries({ queryKey: ["performance"] });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!Object.values(values).some((v) => v !== "")) {
      setFormError("Enter at least one recovery measurement.");
      return;
    }
    setBusy(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(values)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => [k, Number(v)]),
      );
      await api.post("/performance/daily", { date, ...payload, notes });
      toast.success("Recovery saved. Automatic review queued.");
      await refresh();
    } catch (e: any) {
      setFormError(
        e.response?.data?.errors?.[0] ||
          "Could not save this check-in. Your entries are still here; try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const importData = async () => {
    setImportError("");
    setBusy(true);
    try {
      const parsed = JSON.parse(json);
      if (parsed.sleep?.summary || parsed.summary?.totalMinutesAsleep != null) {
        await api.post("/performance/import/fitbit", {
          ...parsed,
          consent,
          date: parsed.sleep?.[0]?.dateOfSleep || date,
        });
      } else
        await api.post("/performance/import", {
          consent,
          sourceLabel: source,
          records: Array.isArray(parsed) ? parsed : parsed.records,
        });
      toast.success("Data imported. Automatic reviews queued.");
      await refresh();
    } catch (e: any) {
      setImportError(
        e.response?.data?.errors?.[0] ||
          "This file could not be imported. Use the sample format or a Fitbit daily sleep summary.",
      );
    } finally {
      setBusy(false);
    }
  };
  const sample = () => {
    setSource("Example format — demo data");
    setJson(
      JSON.stringify(
        [
          {
            date,
            sleepMinutes: 444,
            restingHeartRate: 56,
            hrvMs: 48,
            steps: 8200,
            fatigue: 3,
            soreness: 3,
          },
        ],
        null,
        2,
      ),
    );
  };
  return (
    <div className="product-page">
      <div className="recovery-toolbar">
        <Link to="/athlete" className="text-action">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
        <CheckInControl
          records={!isLoading && !isError ? (data?.records ?? []) : undefined}
        />
      </div>
      {isError && (
        <div className="product-alert">
          Could not load recovery data.{" "}
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}
      <DayLogBoard />
      <div className="recovery-page-grid">
        <form className="work-panel" onSubmit={save}>
          <div className="section-heading">
            <h2>Daily check-in</h2>
            <span className="status-pill">Manual entry</span>
          </div>
          <div className="panel-body form-grid">
            {formError && (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="product-alert full-width"
              >
                <strong>Check your recovery entry</strong>
                <p>{formError}</p>
                <a href="#measurement-sleepMinutes">
                  Go to recovery measurements
                </a>
              </div>
            )}
            <label>
              Date
              <input
                type="date"
                required
                className="fp-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            {[
              ["sleepMinutes", "Sleep (minutes)", 0, 1440],
              ["restingHeartRate", "Resting heart rate (bpm)", 25, 220],
              ["hrvMs", "HRV (ms)", 1, 400],
              ["steps", "Steps", 0, 200000],
              ["fatigue", "Fatigue (1–10)", 1, 10],
              ["soreness", "Soreness (1–10)", 1, 10],
            ].map(([key, label, min, max]) => (
              <label key={key}>
                {label}
                <input
                  id={`measurement-${key}`}
                  type="number"
                  aria-invalid={
                    formError && key === "sleepMinutes" ? true : undefined
                  }
                  aria-describedby={
                    formError && key === "sleepMinutes"
                      ? "measurement-error"
                      : undefined
                  }
                  className="fp-input"
                  min={Number(min)}
                  max={Number(max)}
                  value={values[key]}
                  placeholder="Not recorded"
                  onChange={(e) =>
                    setValues({ ...values, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            {formError && (
              <p id="measurement-error" className="small-note full-width">
                {formError}
              </p>
            )}
            <label className="full-width">
              Notes
              <textarea
                className="fp-input"
                value={notes}
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <p className="small-note full-width">
              Save only what you know. Blank fields stay missing. A new record
              automatically queues a training review.
            </p>
            <button className="primary-action" disabled={busy}>
              {busy ? "Saving…" : "Save recovery check-in"}
            </button>
          </div>
        </form>
        <section className="work-panel">
          <div className="section-heading">
            <h2>Bring your watch data</h2>
            <Upload size={18} />
          </div>
          <div className="panel-body">
            {importError && (
              <p className="product-alert" role="alert">
                {importError}
              </p>
            )}
            <p>
              Import normalized daily JSON from a watch export or Fitbit sleep
              summary. Imported files are labeled as user-supplied data, not
              live device sync.
            </p>
            <label className="form-label">
              Source label
              <input
                className="fp-input"
                value={source}
                maxLength={80}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
            <label className="upload-file">
              Choose a JSON export
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size <= 1024 * 1024) setJson(await f.text());
                  else toast.error("Use a JSON file under 1 MB");
                }}
              />
            </label>
            {json && (
              <p className="small-note">
                Export loaded. Check its source label, then import to save and
                review.
              </p>
            )}
            <details className="import-format">
              <summary>Preview, paste or view an example format</summary>
              <label className="form-label">
                Import preview
                <textarea
                  className="fp-input import-json"
                  rows={6}
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder="Paste a JSON array of daily metrics"
                />
              </label>
              <button type="button" className="text-action" onClick={sample}>
                Show sample format (example data)
              </button>
            </details>
            <label className="consent-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I agree to store this data for training guidance and automatic
              review.
            </label>
            <button
              className="primary-action"
              disabled={busy || !json || !consent}
              onClick={importData}
            >
              Import and review
            </button>
            <div className="integration-note">
              <strong>Live wearable connections</strong>
              <p>
                Fitbit, Garmin and phone health stores require their own app
                authorization or native bridge. The Jira AI keys enable Gemini;
                they do not authorize access to your watches.
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="work-panel mt-6">
        <div className="section-heading">
          <h2>Automatic review history</h2>
          <span className="status-pill">Coach-approved changes</span>
        </div>
        <div className="panel-body review-history">
          {isLoading ? (
            <p>Loading…</p>
          ) : !data?.reviews?.length ? (
            <p>
              No reviews yet. Save a recovery check-in or complete a workout to
              start.
            </p>
          ) : (
            data.reviews.map((r: any) => (
              <article key={r._id}>
                <div className="review-history-head">
                  <h3>{r.trigger.replaceAll("_", " ")}</h3>
                  <span className="status-pill">
                    {r.status} · {r.approval.replaceAll("_", " ")}
                  </span>
                </div>
                <p>
                  {r.analysis?.summary ||
                    "Your review is queued. This page refreshes automatically."}
                </p>
                {r.analysis?.observations?.map((o: string) => (
                  <p className="review-observation" key={o}>
                    <CheckCircle2 size={14} />
                    {o}
                  </p>
                ))}
                {r.analysis && (
                  <p className="small-note">
                    {r.analysis.reason} ·{" "}
                    {r.aiStatus === "ready"
                      ? "Gemini explanation + rules checks"
                      : "Rules checks; AI explanation unavailable"}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
