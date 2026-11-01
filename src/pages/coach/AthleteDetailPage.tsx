import { useMyAthletes } from "../../queries/useCoach";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useParams, Link } from "react-router-dom";
import { WeeklyDragBoard } from "../../components/coach/WeeklyDragBoard";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
import { InsightsPanel } from "../../components/workout/InsightsPanel";
import { MessageThread } from "../../components/common/MessageThread";
import { useAuth } from "../../hooks/useAuth";
import "../../dashboard.css";

function daysSince(value?: string | null) {
  if (!value) return null;
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(1, Math.round((todayDay.getTime() - startDay.getTime()) / 86400000) + 1);
}

export default function AthleteDetailPage() {
  const { athleteId } = useParams();
  const { data: roster } = useMyAthletes();
  const { user } = useAuth();
  const athlete = roster?.athletes.find(
    (row) => row.athlete._id === athleteId,
  )?.athlete;
  const dashboard = useQuery({
    queryKey: ["athlete-dashboard", athleteId],
    queryFn: async () => (await api.get(`/coach/athletes/${athleteId}/dashboard`)).data.data,
    enabled: Boolean(athleteId),
  });
  const [showCheckins, setShowCheckins] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const summarize = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/ai/summary/${athleteId}`);
      setSummary(r.data.data.summary);
    } catch {
      setSummary("The weekly summary could not be prepared. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  if (!athleteId) return null;
  const formatDay = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  const formatMoney = (minor?: number, currency = "INR") => {
    if (!minor) return "None yet";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  };
  const coachingSince = dashboard.data?.coachingSince as string | null | undefined;
  const daysTogether = daysSince(coachingSince);

  return (
    <div className="product-page athlete-detail-page">
      <Link to="/coach" className="text-sm underline">
        ← Back to athletes
      </Link>
      <header className="coach-athlete-head">
        <h1 className="font-display text-2xl font-semibold">
          {athlete?.name || "Athlete overview"}
        </h1>
        {dashboard.data && (
          <p className="coach-athlete-tenure">
            {daysTogether != null ? (
              <>
                <strong>
                  {daysTogether} {daysTogether === 1 ? "day" : "days"}
                </strong>
                <span>
                  with you
                  {dashboard.data.sport ? ` · ${dashboard.data.sport}` : ""} · since{" "}
                  {formatDay(coachingSince)}
                </span>
              </>
            ) : (
              <>
                <strong>{formatDay(dashboard.data.athlete.joinedAt)}</strong>
                <span>Joined Rhythm</span>
              </>
            )}
          </p>
        )}
      </header>
      <div className="athlete-detail-grid coach-athlete-layout">
      <div className="coach-athlete-main">
      {dashboard.data && (
        <section className="coach-facts" aria-label="What matters for this athlete">
          <div>
            <strong>{dashboard.data.sessionsCompleted}</strong>
            <span>Sessions completed</span>
          </div>
          <div>
            <strong>{dashboard.data.sessionsAssigned}</strong>
            <span>Sessions assigned</span>
          </div>
          <div>
            <strong>{dashboard.data.sessionsLogged30d}</strong>
            <span>Logged in 30 days</span>
          </div>
          <div>
            <strong>{formatDay(dashboard.data.athlete.joinedAt)}</strong>
            <span>Joined Rhythm</span>
          </div>
          <div>
            <strong>{formatDay(dashboard.data.coachingSince)}</strong>
            <span>Training with you since</span>
          </div>
          <div>
            <strong>{formatMoney(dashboard.data.paidMinor, dashboard.data.currency)}</strong>
            <span>
              {dashboard.data.payments?.length
                ? `Paid to you · ${dashboard.data.payments.length} payment${dashboard.data.payments.length === 1 ? "" : "s"}`
                : "Paid to you"}
            </span>
          </div>
        </section>
      )}
      <MonthCalendar athleteId={athleteId} />
      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">This week (drag to reschedule)</h2>
        <div className="mt-3">
          <WeeklyDragBoard athleteId={athleteId} />
        </div>
      </div>
      <div className="mt-6">
        <InsightsPanel athleteId={athleteId} canViewOnModel={false} />
      </div>
      <section className="mt-6 page-section">
        <button
          onClick={summarize}
          disabled={busy}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          {busy ? "Preparing summary…" : "Summarize this week"}
        </button>
        {summary && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
            {summary}
          </p>
        )}
      </section>
      {dashboard.isError && (
        <p className="mt-6">
          This athlete’s dashboard could not be loaded.{" "}
          <button type="button" onClick={() => dashboard.refetch()}>
            Retry
          </button>
        </p>
      )}
      {dashboard.data && (
        <section className="page-section athlete-dashboard coach-checkins" aria-label="Recovery check-ins">
          <div className="section-row">
            <h3>Recovery check-ins</h3>
            {dashboard.data.records.length > 0 && (
              <button
                type="button"
                className="text-action"
                aria-expanded={showCheckins}
                onClick={() => setShowCheckins((open) => !open)}
              >
                {showCheckins
                  ? "Hide check-ins"
                  : `Show ${dashboard.data.records.length} check-ins`}
              </button>
            )}
          </div>
          {!dashboard.data.records.length ? (
            <p>No recovery records yet.</p>
          ) : showCheckins ? (
            <ul className="data-list">
              {dashboard.data.records.map((row: any) => (
                <li key={row.date + row.sourceLabel}>
                  <strong>{row.date}</strong>
                  <span>
                    {row.sleepMinutes != null
                      ? `${Math.floor(row.sleepMinutes / 60)}h ${row.sleepMinutes % 60}m sleep`
                      : "Sleep not recorded"}
                    {row.restingHeartRate != null ? ` · ${row.restingHeartRate} bpm` : ""}
                    {row.sourceLabel ? ` · ${row.sourceLabel}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>The day-by-day check-ins stay closed until you ask for them.</p>
          )}
        </section>
      )}
      {dashboard.data && (
        <section className="page-section athlete-dashboard coach-checkins" aria-label="Session logs">
          <div className="section-row">
            <h3>Session logs</h3>
            <button
              type="button"
              className="text-action"
              aria-expanded={showLogs}
              onClick={() => setShowLogs((open) => !open)}
            >
              {showLogs ? "Hide logs" : "Show logs"}
            </button>
          </div>
          {showLogs ? (
            <>
              <h3>Workout logs</h3>
              {dashboard.data.logs.length ? (
                <ul className="data-list">
                  {dashboard.data.logs.map((log: any) => (
                    <li key={log._id}>
                      <strong>
                        {new Date(log.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </strong>
                      <span>
                        {log.exercises.join(", ") || "Logged session"}
                        {log.durationMin ? ` · ${log.durationMin} min` : ""}
                        {log.painFlag ? " · pain flagged" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No workout logs yet.</p>
              )}
              <h3>Daily logs</h3>
              {dashboard.data.daily.length ? (
                <ul className="data-list">
                  {dashboard.data.daily.map((row: any) => (
                    <li key={row.date}>
                      <strong>{row.date}</strong>
                      <span>
                        {row.foods} foods · {row.waterMl} ml water
                        {row.note ? ` · ${row.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No daily food or water logs yet.</p>
              )}
            </>
          ) : (
            <p>Workout and daily logs stay closed until you ask for them.</p>
          )}
        </section>
      )}
      </div>
      <aside className="coach-athlete-chat dash-side-card" aria-labelledby="athlete-messages">
        <h2 id="athlete-messages">
          Messages with {athlete?.name?.split(" ")[0] || "this athlete"}
        </h2>
        <MessageThread
          endpoint={`/coach/athletes/${athleteId}/messages`}
          selfId={user?._id || ""}
          otherName={athlete?.name?.split(" ")[0] || "Athlete"}
          placeholder="Write to your athlete…"
        />
      </aside>
      </div>
    </div>
  );
}
