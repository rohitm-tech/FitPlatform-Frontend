import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAthleteWorkouts } from "../../queries/useAthlete";
import { useAssignTemplate, useMyAthletes, useTemplates } from "../../queries/useCoach";
import { athleteApi } from "../../services/endpoints/athleteApi";
import { useAuth } from "../../hooks/useAuth";
import { CommentsThread } from "./CommentsThread";
import {
  assignmentSource,
  dayBrief,
  dayMark,
  logWorkoutId,
  moveRows,
  moveWord,
  setTally,
  statusWord,
  tallyLine,
  todayReminder,
} from "./dayProgress";
import type { Workout, WorkoutLog } from "../../types/domain";
import {
  formatLoggedSet,
  isGymSession,
  kindForSport,
  pieceName,
  sessionCountLabel,
} from "../../lib/sessionSports";
import "../../calendar.css";

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function MonthCalendar({
  athleteId,
  showDayPanel = false,
}: {
  athleteId: string | undefined;
  showDayPanel?: boolean;
}) {
  const { user } = useAuth();
  const self = user?._id === athleteId;
  const showDay = self || showDayPanel;
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [params] = useSearchParams();
  const requestedDate = params.get("date");
  const todayKey = dateKey(new Date());
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
    enabled: !!athleteId && showDay,
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
  const monthWorkouts = workouts.data || [];
  const allLogs = (showDay ? logs.data || [] : []) as WorkoutLog[];
  const selectedWorkouts = monthWorkouts.filter(
    (w) => dateKey(new Date(w.date)) === selected,
  );
  const loadingDay = workouts.isLoading || (showDay && logs.isLoading);
  const selectedLogs = allLogs.filter(
    (l) => dateKey(new Date(l.date)) === selected,
  );
  const linkedIds = new Set(selectedWorkouts.map((workout) => workout._id));
  const extraLogs = selectedLogs.filter((log) => {
    const id = logWorkoutId(log);
    return !id || !linkedIds.has(id);
  });
  const brief = dayBrief({
    workouts: selectedWorkouts,
    athleteId,
    viewerIsSelf: self,
  });
  const tally = setTally(selectedWorkouts, showDay ? selectedLogs : []);
  const todayInView =
    viewedMonth.getFullYear() === new Date().getFullYear() &&
    viewedMonth.getMonth() === new Date().getMonth();
  const todayBounds = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);
  const todayFetch = useAthleteWorkouts(todayInView ? undefined : athleteId, todayBounds);
  const todayWorkouts = (
    todayInView ? monthWorkouts : todayFetch.data || []
  ).filter((workout) => dateKey(new Date(workout.date)) === todayKey);
  const reminder =
    selected === todayKey
      ? ""
      : todayReminder({
          workouts: todayWorkouts,
          athleteId,
          viewerIsSelf: self,
        });
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
            {!self && athleteId && (
              <AssignTemplate athleteId={athleteId} date={selected} />
            )}
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
                setSelected(todayKey);
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
        {reminder && (
          <p className="today-reminder">
            {reminder}{" "}
            <button
              type="button"
              onClick={() => {
                setMonthOffset(0);
                setSelected(todayKey);
              }}
            >
              Show today
            </button>
          </p>
        )}
        <div className="calendar-legend">
          <span>
            <i className="planned" />
            To log
          </span>
          <span>
            <i className="completed" />
            Logged
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
            const sessions = monthWorkouts.filter(
              (w) => dateKey(new Date(w.date)) === key,
            );
            const mark = dayMark(sessions);
            const done = sessions.filter((w) => w.status === "completed").length;
            const coachCount = sessions.filter(
              (w) => assignmentSource(w.assignedBy, athleteId).key === "coach",
            ).length;
            const longDate = date.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            });
            const sessionWords = sessions.length
              ? `${done} of ${sessions.length} logged. ${sessions
                  .map((w) => `${w.title}, ${statusWord(w.status)}`)
                  .join(". ")}`
              : "No sessions";
            const coachWords = coachCount
              ? self
                ? ` ${coachCount} from your coach.`
                : ` ${coachCount} assigned by a coach.`
              : "";
            return (
              <button
                type="button"
                key={key}
                className={`calendar-day ${selected === key ? "selected" : ""} ${key === todayKey ? "today" : ""} ${sessions.some((w) => w.status === "planned") ? "has-open" : ""} ${sessions.length > 0 && sessions.every((w) => w.status === "completed") ? "is-complete" : ""}`}
                aria-pressed={selected === key}
                disabled={workouts.isLoading}
                aria-label={`${longDate}. ${sessionWords}.${coachWords}`}
                title={sessions.map((w) => w.title).join(", ") || undefined}
                onClick={() => setSelected(key)}
              >
                <span className="calendar-date">{day}</span>
                <div className="calendar-marks">
                  {sessions.slice(0, 3).map((w) => (
                    <i key={w._id} className={w.status} />
                  ))}
                </div>
                {mark && <span className="calendar-fraction">{mark}</span>}
              </button>
            );
          })}
        </div>
      </section>
      {showDay && (
      <section
        className="page-section calendar-day-detail"
        aria-label="Selected day"
      >
        <div className="section-row">
          <h2>
            {new Date(selected + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          {self && (
            <Link className="primary-action" to={`/athlete/log?date=${selected}`}>
              Log a workout
            </Link>
          )}
        </div>
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
            <p>
              {self
                ? "Nothing is assigned for this day, and nothing is logged."
                : "Nothing is assigned for this day."}
            </p>
            {self && (
              <Link className="page-back" to={`/athlete/log?date=${selected}`}>
                Log a session
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <>
            {brief ? (
              <p className="day-brief" aria-live="polite">
                {brief}
              </p>
            ) : self && selectedLogs.length ? (
              <p className="day-brief" aria-live="polite">
                You logged this day on your own. Your coach has not assigned
                anything here.
              </p>
            ) : null}
            {tally.assigned > 0 && (
              <p className="day-tally">
                {tallyLine(tally.recorded, tally.assigned, self)}
              </p>
            )}
            {tally.piecesAssigned > 0 && (
              <p className="day-tally">
                {tally.piecesRecorded} of {tally.piecesAssigned}{" "}
                {tally.piecesAssigned === 1 ? "piece" : "pieces"} logged
              </p>
            )}
            <div className="data-list">
              {selectedWorkouts.map((workout) => (
                <SessionBlock
                  key={workout._id}
                  workout={workout}
                  logs={showDay ? selectedLogs : []}
                  showSets={showDay}
                  athleteId={athleteId}
                  self={self}
                />
              ))}
            </div>
            {showDay && extraLogs.length > 0 && (
              <div className="data-list">
                {extraLogs.map((log) => {
                  const recordedSets = log.items.reduce(
                    (n, item) => n + item.sets.length,
                    0,
                  );
                  return (
                  <article key={log._id}>
                    <div className="section-row">
                      <h3>
                        {log.workoutId ? "Session log" : "Logged on your own"}
                      </h3>
                      <span className="calendar-status completed">Logged</span>
                    </div>
                    <p className="session-origin">
                      {log.durationMin > 0 ? `${log.durationMin} min · ` : ""}
                      {recordedSets} recorded {recordedSets === 1 ? "set" : "sets"}
                      {log.perceivedEffort
                        ? ` · Effort ${log.perceivedEffort}/10`
                        : ""}
                    </p>
                    <ol className="session-checklist">
                      {log.items.map((item, i) => (
                        <li key={i}>
                          <span className="session-check logged">Logged</span>
                          <span className="session-move">
                          <strong>{pieceName(item)}</strong>
                          <span>
                            {item.sets
                              .map((set) => formatLoggedSet(set, item.kind))
                              .join(" · ")}
                          </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                    {log.notes && <p className="session-origin">{log.notes}</p>}
                    {log.painFlag && (
                      <p className="field-error">
                        Pain or discomfort was recorded.
                      </p>
                    )}
                  </article>
                  );
                })}
              </div>
            )}
          </>
        )}
        {showDay && logs.isError && (
          <p className="field-error">
            Recorded logs could not be loaded.{" "}
            <button onClick={() => logs.refetch()}>Retry</button>
          </p>
        )}
      </section>
      )}
    </div>
  );
}

function AssignTemplate({
  athleteId,
  date,
}: {
  athleteId: string;
  date: string;
}) {
  const queries = useQueryClient();
  const templates = useTemplates();
  const roster = useMyAthletes();
  const assign = useAssignTemplate();
  const [templateId, setTemplateId] = useState("");
  const sport =
    roster.data?.athletes.find((row) => row.athlete._id === athleteId)?.sport ||
    "Strength";
  const saved = (templates.data || []).filter(
    (template) => (template.sport || "Strength") === sport,
  );
  const submit = async () => {
    if (!templateId) return;
    try {
      await assign.mutateAsync({
        templateId,
        athleteIds: [athleteId],
        dates: [date],
      });
      await queries.invalidateQueries({ queryKey: ["athlete-workouts", athleteId] });
      toast.success("Template assigned to this day");
      setTemplateId("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "The template could not be assigned.",
      );
    }
  };
  if (templates.isLoading || roster.isLoading) return <p>Loading templates…</p>;
  if (!saved.length) {
    return (
      <Link className="text-action" to="/coach/builder">
        Create a {sport} template to assign
        <ArrowUpRight size={14} />
      </Link>
    );
  }
  return (
    <form
      className="calendar-assign"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor={`assign-${date}`}>
        Template for the selected day
      </label>
      <select
        id={`assign-${date}`}
        className="fp-input"
        value={templateId}
        aria-label="Template for the selected day"
        onChange={(event) => setTemplateId(event.target.value)}
        required
      >
        <option value="">Choose a template</option>
        {saved.map((template) => (
          <option key={template._id} value={template._id}>
            {template.title}
            {kindForSport(template.sport || "Strength") !== "strength"
              ? ` · ${template.sport}`
              : ""}
          </option>
        ))}
      </select>
      <button
        className="calendar-assign-confirm"
        disabled={assign.isPending || !templateId}
        aria-label={assign.isPending ? "Assigning template" : "Assign template to the selected day"}
      >
        <Check size={16} />
      </button>
    </form>
  );
}

function SessionBlock({
  workout,
  logs,
  showSets,
  athleteId,
  self,
}: {
  workout: Workout;
  logs: WorkoutLog[];
  showSets: boolean;
  athleteId: string | undefined;
  self: boolean;
}) {
  const origin = assignmentSource(workout.assignedBy, athleteId);
  const rows = moveRows(workout, logs, showSets);
  const gym = isGymSession(workout);
  const assignedSets = workout.items.reduce((sum, item) => sum + (item.sets || 0), 0);
  const linkedLogs = logs.filter((log) => logWorkoutId(log) === workout._id);
  const minutes = linkedLogs.reduce((sum, log) => sum + (log.durationMin || 0), 0);
  const effort = linkedLogs.find((log) => log.perceivedEffort)?.perceivedEffort;
  const originLabel =
    !self && origin.key === "coach" ? "Assigned by a coach" : origin.label;
  return (
    <article>
      <div className="section-row">
        <h3>{workout.title}</h3>
        <span className={`calendar-status ${workout.status}`}>
          {statusWord(workout.status)}
        </span>
      </div>
      <p className="session-origin">
        {originLabel}
        {workout.sport ? ` · ${workout.sport}` : ""} · {sessionCountLabel(workout.items.length, gym)}
        {gym
          ? ` · ${assignedSets} ${assignedSets === 1 ? "set" : "sets"}`
          : ""}
      </p>
      {showSets && workout.status === "completed" && linkedLogs.length === 0 && (
        <p className="section-note">Marked complete, with no set-by-set log.</p>
      )}
      {showSets && linkedLogs.length > 0 && (
        <p className="session-origin">
          {minutes > 0 ? `${minutes} min logged` : "Time not recorded"}
          {effort ? ` · Effort ${effort}/10` : ""}
        </p>
      )}
      {rows.length > 0 ? (
        <ol className="session-checklist">
          {rows.map((row, index) => (
            <li key={`${row.name}-${index}`} className={`is-${row.state}`}>
              <span className={`session-check ${row.state}`}>{moveWord(row.state)}</span>
              <span className="session-move">
                <strong>{row.name}</strong>
                <span>{row.prescription}</span>
                {row.notes && <span className="session-coach-line">{row.notes}</span>}
              </span>
              {row.recordedLabel && (
                <span className="session-recorded">{row.recordedLabel}</span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="section-note">No exercises on this session.</p>
      )}
      {linkedLogs.some((log) => log.painFlag) && (
        <p className="field-error">Pain or discomfort was recorded.</p>
      )}
      {linkedLogs
        .filter((log) => log.notes)
        .map((log) => (
          <p key={log._id} className="session-origin">
            {log.notes}
          </p>
        ))}
      {self && workout.status === "planned" && (
        <Link className="secondary-action" to={`/athlete/log?workoutId=${workout._id}`}>
          Log this session
          <ArrowUpRight size={15} />
        </Link>
      )}
      {athleteId && <CommentsThread athleteId={athleteId} workoutId={workout._id} />}
    </article>
  );
}
