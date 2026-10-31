import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { useAthleteWorkouts } from "../../queries/useAthlete";
import { athleteApi } from "../../services/endpoints/athleteApi";
import { useAuth } from "../../hooks/useAuth";
import { CommentsThread } from "./CommentsThread";
import "../../calendar.css";
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function MonthCalendar({
  athleteId,
}: {
  athleteId: string | undefined;
}) {
  const { user } = useAuth();
  const self = user?._id === athleteId;
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [params] = useSearchParams();
  const requestedDate = params.get("date");
  useEffect(() => {
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      const day = new Date(requestedDate + "T12:00:00");
      if (!Number.isNaN(day.getTime())) {
        setSelected(requestedDate);
        const now = new Date();
        setMonthOffset(
          (day.getFullYear() - now.getFullYear()) * 12 +
            day.getMonth() -
            now.getMonth(),
        );
      }
    }
  }, [requestedDate]);
  const viewedMonth = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }, [monthOffset]);
  const from = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth(),
    1,
  ).toISOString();
  const to = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  ).toISOString();
  const workouts = useAthleteWorkouts(athleteId, { from, to });
  const logs = useQuery({
    queryKey: ["athlete-logs", athleteId],
    queryFn: async () => (await athleteApi.listLogs(athleteId!)).data.data,
    enabled: !!athleteId && self,
  });
  const total = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells: (number | null)[] = [
    ...Array(viewedMonth.getDay()).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  const selectedWorkouts = (workouts.data || []).filter(
    (w) => dateKey(new Date(w.date)) === selected,
  );
  const loadingDay = workouts.isLoading || (self && logs.isLoading);
  const selectedLogs = (logs.data || []).filter(
    (l) => dateKey(new Date(l.date)) === selected,
  );
  const changeMonth = (delta: number) => {
    const date = new Date(viewedMonth);
    date.setMonth(date.getMonth() + delta);
    setMonthOffset((value) => value + delta);
    setSelected(dateKey(date));
  };
  return (
    <div className="training-calendar-layout">
      <section
        className="page-section calendar-panel"
        aria-label="Training calendar"
      >
        <div className="section-row">
          <h2>
            {viewedMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="calendar-controls">
            <button
              className="icon-control"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                setMonthOffset(0);
                setSelected(dateKey(new Date()));
              }}
            >
              Today
            </button>
            <button
              className="icon-control"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="planned" />
            Planned
          </span>
          <span>
            <i className="completed" />
            Completed
          </span>
          <span>
            <i className="skipped" />
            Skipped
          </span>
        </div>
        {workouts.isLoading && (
          <p className="section-note" role="status">
            Loading sessions…
          </p>
        )}
        {workouts.isError && (
          <div className="form-feedback" role="alert">
            Sessions could not be loaded.{" "}
            <button onClick={() => workouts.refetch()}>Retry</button>
          </div>
        )}
        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((day, i) => {
            if (!day)
              return <div key={`blank-${i}`} className="calendar-blank" />;
            const date = new Date(
              viewedMonth.getFullYear(),
              viewedMonth.getMonth(),
              day,
            );
            const key = dateKey(date);
            const sessions = (workouts.data || []).filter(
              (w) => dateKey(new Date(w.date)) === key,
            );
            return (
              <button
                type="button"
                key={key}
                className={`calendar-day ${selected === key ? "selected" : ""} ${key === dateKey(new Date()) ? "today" : ""}`}
                aria-pressed={selected === key}
                disabled={workouts.isLoading}
                aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, ${sessions.length} sessions${sessions.length ? ", " + sessions.map((w) => `${w.title}: ${w.status}`).join(", ") : ""}`}
                onClick={() => setSelected(key)}
              >
                <span>{day}</span>
                <div className="calendar-marks">
                  {sessions.slice(0, 3).map((w) => (
                    <i key={w._id} className={w.status} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <p className="section-note">Select a date to see its sessions.</p>
      </section>
      <section
        className="page-section calendar-day-detail"
        aria-label="Selected day"
      >
        <h2>
          {new Date(selected + "T12:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {loadingDay ? (
          <p className="empty-copy" role="status">
            Loading this day’s sessions…
          </p>
        ) : workouts.isError ? (
          <p className="empty-copy">
            Session records are unavailable. Retry the calendar request.
          </p>
        ) : !selectedWorkouts.length && !selectedLogs.length ? (
          <div className="empty-copy">
            <p>No sessions recorded for this day.</p>
            {self && (
              <Link className="page-back" to={`/athlete/log?date=${selected}`}>
                Log a session
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="data-list">
              {selectedWorkouts.map((w) => (
                <article key={w._id}>
                  <div className="section-row">
                    <h3>{w.title}</h3>
                    <span className={`calendar-status ${w.status}`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="section-note">
                    {w.items.length} exercises ·{" "}
                    {w.items.reduce((sum, item) => sum + item.sets, 0)} assigned
                    sets
                  </p>
                  <details className="session-targets">
                    <summary>Session targets</summary>
                    <ul>
                      {w.items.map((item, i) => (
                        <li key={i}>
                          {typeof item.exerciseId === "string"
                            ? "Exercise"
                            : item.exerciseId.name}
                          <span>
                            {item.sets} × {item.reps}
                            {item.targetWeightKg != null
                              ? ` · ${item.targetWeightKg} kg`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                  {self && w.status === "planned" && (
                    <Link
                      className="secondary-action"
                      to={`/athlete/log?workoutId=${w._id}`}
                    >
                      Log this session
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                  {athleteId && (
                    <CommentsThread athleteId={athleteId} workoutId={w._id} />
                  )}
                </article>
              ))}
            </div>
            {self && (
              <div className="data-list">
                {selectedLogs.map((log) => (
                  <article key={log._id}>
                    <div className="section-row">
                      <h3>
                        {log.workoutId ? "Session log" : "Independent session"}
                      </h3>
                      <span className="calendar-status completed">Logged</span>
                    </div>
                    <p className="section-note">
                      {log.durationMin} min ·{" "}
                      {log.items.reduce((n, item) => n + item.sets.length, 0)}{" "}
                      recorded sets
                      {log.perceivedEffort
                        ? ` · Effort ${log.perceivedEffort}/10`
                        : ""}
                    </p>
                    <details className="session-targets">
                      <summary>Recorded sets</summary>
                      <ul>
                        {log.items.map((item, i) => (
                          <li key={i}>
                            <strong>
                              {typeof item.exerciseId === "string"
                                ? "Exercise"
                                : item.exerciseId.name}
                            </strong>
                            <span>
                              {item.sets
                                .map(
                                  (s) => `${s.reps} reps at ${s.weightKg} kg`,
                                )
                                .join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {log.notes && <p>{log.notes}</p>}
                      {log.painFlag && (
                        <p className="field-error">
                          Pain or discomfort was recorded.
                        </p>
                      )}
                    </details>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
        {self && logs.isError && (
          <p className="field-error">
            Recorded logs could not be loaded.{" "}
            <button onClick={() => logs.refetch()}>Retry</button>
          </p>
        )}
      </section>
    </div>
  );
}
