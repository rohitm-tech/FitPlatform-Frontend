import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, MessageSquare, Plus, Sparkles, X } from "lucide-react";
import { MessageThread } from "../../components/common/MessageThread";
import { AthletePlanStrip } from "../../components/billing/PlanStrip";
import "../../dashboard.css";
import { useAuth } from "../../hooks/useAuth";
import {
  useAthleteHome,
  useAthleteInsights,
  useAthleteWorkouts,
} from "../../queries/useAthlete";
import { usePerformance } from "../../queries/usePerformance";
import TrainingCompanion from "../../components/athlete/TrainingCompanion";
import {
  CheckInControl,
  DailyLogDialog,
} from "../../components/athlete/CheckInDialog";
import type { LogTab } from "../../components/athlete/CheckInDialog";
import {
  foodLine,
  foodTotals,
  litres,
  useDailyLogs,
} from "../../queries/useDailyLog";
import type { WorkoutItem } from "../../types/domain";

type RecoveryRecord = {
  date: string;
  sleepMinutes?: number | null;
  hrvMs?: number | null;
  restingHeartRate?: number | null;
  source?: string;
  sourceLabel?: string;
};

type Readiness = {
  score?: number | null;
  status?: string;
  reasons?: string[];
};

type PerformanceSnapshot = {
  records?: RecoveryRecord[];
  readiness?: Readiness;
};

const STATUS_WORD: Record<string, string> = {
  ready: "Ready",
  steady: "Steady",
  recover: "Low",
  stale: "Out of date",
  insufficient: "Incomplete",
  missing: "No score yet",
};

function localKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function lastDays(count: number) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return date;
  });
}

function labelFromKey(key: string, withWeekday = false) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
  });
}

function labelFromInstant(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSleep(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function exerciseName(item: WorkoutItem) {
  return typeof item.exerciseId === "string"
    ? "Exercise"
    : item.exerciseId?.name || "Exercise";
}

function assignmentSource(assignedBy: string | undefined, athleteId?: string) {
  if (assignedBy === "ai") return { key: "ai", label: "AI draft" };
  if (athleteId && assignedBy === athleteId)
    return { key: "you", label: "You planned this" };
  if (assignedBy) return { key: "coach", label: "From your coach" };
  return { key: "unknown", label: "Assigned" };
}

function ReadinessMark({
  score,
  status,
}: {
  score: number | null;
  status: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const portion = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const word = STATUS_WORD[status] || "No score yet";
  return (
    <div className={`readiness-mark-wrap ${status || "missing"}`}>
      <svg
        className="readiness-mark"
        viewBox="0 0 120 120"
        role="img"
        aria-label={
          score == null
            ? "No training-readiness score"
            : `Training readiness ${score} out of 100`
        }
      >
        <circle className="mark-track" cx="60" cy="60" r={radius} />
        <circle
          className="mark-arc"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={`${circumference * portion} ${circumference}`}
          strokeLinecap={portion === 0 ? "butt" : "round"}
          transform="rotate(-90 60 60)"
        />
        <text className="mark-score" x="60" y="56">
          {score == null ? "—" : score}
        </text>
        <text className="mark-unit" x="60" y="76">
          {score == null ? "no score" : "of 100"}
        </text>
      </svg>
      <p>{word}</p>
    </div>
  );
}

function SleepChart({ records }: { records: RecoveryRecord[] }) {
  const days = lastDays(14);
  const byDate = new Map<string, RecoveryRecord>();
  for (const record of records) {
    if (!byDate.has(record.date)) byDate.set(record.date, record);
  }
  const todayKey = localKey(new Date());
  const points = days.map((date) => {
    const key = localKey(date);
    const record = byDate.get(key);
    const minutes = record?.sleepMinutes;
    return {
      key,
      minutes: minutes == null ? null : minutes,
      hours: minutes == null ? null : minutes / 60,
      demo: record?.source === "demo",
    };
  });
  const maxHours = Math.max(10, ...points.map((point) => point.hours ?? 0));
  const width = 460;
  const height = 150;
  const padL = 34;
  const padR = 6;
  const padT = 12;
  const padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const slot = innerW / points.length;
  const barW = Math.min(16, slot * 0.62);
  const yFor = (hours: number) => padT + innerH - (hours / maxHours) * innerH;
  const recorded = points.filter((point) => point.minutes != null).length;
  const hasDemo = points.some((point) => point.demo);
  return (
    <div className="sleep-chart-block">
      <div className="chart-label-row">
        <p>Sleep, last 14 days</p>
        {hasDemo && <span className="demo-badge">Demo data</span>}
      </div>
      <svg
        className="sleep-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          recorded
            ? `Sleep hours for ${recorded} of the last 14 days. Empty days have no record.`
            : "No sleep recorded in the last 14 days."
        }
      >
        {[0, 7, maxHours].map((hours) => (
          <text
            key={hours}
            className="chart-axis"
            x={padL - 6}
            y={yFor(hours) + 3}
          >
            {hours === 0 ? "0" : `${hours}h`}
          </text>
        ))}
        <line
          className="chart-baseline"
          x1={padL}
          x2={width - padR}
          y1={yFor(7)}
          y2={yFor(7)}
        />
        {points.map((point, index) => {
          const x = padL + index * slot + (slot - barW) / 2;
          const label = labelFromKey(point.key, true);
          return (
            <g key={point.key}>
              {point.hours != null && (
                <rect
                  className={
                    point.minutes != null && point.minutes < 360
                      ? "sleep-bar short"
                      : "sleep-bar"
                  }
                  x={x}
                  y={yFor(point.hours)}
                  width={barW}
                  height={Math.max(2, (point.hours / maxHours) * innerH)}
                  rx="2"
                >
                  <title>{`${label}: ${formatSleep(point.minutes || 0)}`}</title>
                </rect>
              )}
              <text
                className={
                  point.key === todayKey ? "chart-day is-today" : "chart-day"
                }
                x={padL + index * slot + slot / 2}
                y={height - 4}
              >
                {new Date(
                  Number(point.key.slice(0, 4)),
                  Number(point.key.slice(5, 7)) - 1,
                  Number(point.key.slice(8, 10)),
                ).toLocaleDateString(undefined, { weekday: "narrow" })}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="chart-caption">
        {recorded
          ? "Bars are recorded sleep. Brown bars are under 6 hours. Empty days have no record. The dashed line is 7 hours."
          : "No sleep recorded in the last 14 days. Empty days stay empty."}
      </p>
      <details className="sleep-table">
        <summary>View sleep as a table</summary>
        <div className="table-frame">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Sleep</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.key}>
                  <td>{labelFromKey(point.key, true)}</td>
                  <td className="num">
                    {point.minutes == null ? "—" : formatSleep(point.minutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function DayLogTile({ onLog }: { onLog: (tab: LogTab) => void }) {
  const queries = useQueryClient();
  const todayKey = localKey(new Date());
  const logs = useDailyLogs(todayKey, 7);
  const [adding, setAdding] = useState(false);
  const byDate = new Map((logs.data || []).map((log) => [log.date, log]));
  const today = byDate.get(todayKey);
  const totals = foodTotals(today?.foods);
  const week = lastDays(7).map((date) => {
    const key = localKey(date);
    const log = byDate.get(key);
    return {
      key,
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      calories: log?.foods.length ? foodTotals(log.foods).calories : null,
      waterMl: log?.waterMl || null,
    };
  });
  const maxCalories = Math.max(1, ...week.map((day) => day.calories || 0));
  const maxWater = Math.max(1, ...week.map((day) => day.waterMl || 0));
  const lastWeight = (logs.data || []).find((log) => log.weightKg != null);
  const scale = (value?: number | null) => (value == null ? "—" : `${value}/5`);

  const addWater = async () => {
    setAdding(true);
    try {
      await api.post(`/daily-log/${todayKey}/water`, { ml: 250 });
      await queries.invalidateQueries({ queryKey: ["daily-log"] });
    } catch {
      toast.error("Water could not be saved");
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="dash-tile dash-full dash-daylog" aria-labelledby="dash-daylog-title">
      <div className="dash-tile-head">
        <h2 id="dash-daylog-title">Today’s log</h2>
        <button type="button" className="dash-link" onClick={() => onLog("food")}>
          <Plus size={14} aria-hidden="true" />
          Log something
        </button>
      </div>
      {logs.isError ? (
        <p className="dash-muted">
          Your log could not be loaded.{" "}
          <button type="button" className="dash-inline-button" onClick={() => logs.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          <div className="daylog-cells">
            <div className="daylog-cell">
              <span className="dash-tile-label">Food</span>
              <strong>{logs.isLoading ? "…" : `${totals.calories.toLocaleString()} kcal`}</strong>
              <span className="daylog-sub">
                {today?.foods.length ? foodLine(today.foods) : "Nothing yet"}
              </span>
              <button type="button" className="dash-inline-button" onClick={() => onLog("food")}>
                Add food
              </button>
            </div>
            <div className="daylog-cell">
              <span className="dash-tile-label">Water</span>
              <strong>{logs.isLoading ? "…" : litres(today?.waterMl || 0)}</strong>
              <span className="daylog-sub">
                {today?.waterMl ? `${today.waterMl.toLocaleString()} ml` : "Nothing yet"}
              </span>
              <button
                type="button"
                className="dash-inline-button"
                disabled={adding}
                onClick={addWater}
              >
                {adding ? "Adding…" : "+ 250 ml"}
              </button>
            </div>
            <div className="daylog-cell">
              <span className="dash-tile-label">Weight</span>
              <strong>
                {today?.weightKg != null
                  ? `${today.weightKg} kg`
                  : lastWeight
                    ? `${lastWeight.weightKg} kg`
                    : "—"}
              </strong>
              <span className="daylog-sub">
                {today?.weightKg != null
                  ? "Logged today"
                  : lastWeight
                    ? `Last logged ${labelFromKey(lastWeight.date)}`
                    : "Not logged this week"}
              </span>
              <button type="button" className="dash-inline-button" onClick={() => onLog("body")}>
                Log weight
              </button>
            </div>
            <div className="daylog-cell">
              <span className="dash-tile-label">Mood</span>
              <strong>{scale(today?.mood)}</strong>
              <span className="daylog-sub">
                {today?.energy != null || today?.stress != null
                  ? `Energy ${scale(today?.energy)} · Stress ${scale(today?.stress)}`
                  : "How today feels"}
              </span>
              <button type="button" className="dash-inline-button" onClick={() => onLog("body")}>
                Log mood
              </button>
            </div>
          </div>
          <div className="daylog-week" aria-label="Last 7 days of food and water">
            {week.map((day) => (
              <div key={day.key} className={day.key === todayKey ? "is-today" : ""}>
                <span className="daylog-day">{day.weekday}</span>
                <span className="daylog-bars" aria-hidden="true">
                  <i
                    className="daylog-bar-food"
                    style={{ height: `${day.calories ? Math.max(6, (day.calories / maxCalories) * 100) : 0}%` }}
                  />
                  <i
                    className="daylog-bar-water"
                    style={{ height: `${day.waterMl ? Math.max(6, (day.waterMl / maxWater) * 100) : 0}%` }}
                  />
                </span>
                <span className="sr-only">
                  {`${labelFromKey(day.key, true)}: ${day.calories != null ? `${day.calories} kcal` : "no food logged"}, ${day.waterMl ? `${day.waterMl} ml water` : "no water logged"}.`}
                </span>
              </div>
            ))}
          </div>
          <p className="chart-caption daylog-legend">
            <span className="daylog-key daylog-key-food" aria-hidden="true" /> Calories
            <span className="daylog-key daylog-key-water" aria-hidden="true" /> Water
            <span className="daylog-legend-note">Last 7 days. Empty days have no entry.</span>
          </p>
        </>
      )}
    </section>
  );
}

function VolumeList({ volume }: { volume: Record<string, number> | undefined }) {
  const rows = Object.entries(volume || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, sets]) => sets));
  if (!rows.length)
    return <p className="chart-caption">No sets recorded in the last 7 days.</p>;
  return (
    <ul className="volume-list">
      {rows.map(([group, sets]) => (
        <li key={group}>
          <span>{group}</span>
          <span className="volume-track" aria-hidden="true">
            <span style={{ width: `${(sets / max) * 100}%` }} />
          </span>
          <span>{sets}</span>
        </li>
      ))}
    </ul>
  );
}

const GOAL_WORD: Record<string, string> = {
  muscle_gain: "Build muscle",
  fat_loss: "Lose fat",
  strength: "Get stronger",
  general_fitness: "General fitness",
  race: "Race preparation",
};

const SETTING_WORD: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  either: "In person or online",
};

type MyCoach = {
  coach: { _id: string; name: string; email: string } | null;
  profile?: {
    headline?: string;
    specialties?: string[];
    city?: string;
    sport?: string;
    experienceYears?: number;
    isPublic?: boolean;
  } | null;
  since?: string;
  unread?: number;
  lastMessage?: { text: string; senderId: string; createdAt: string } | null;
  lastAssigned?: { title: string; date: string; status: string; createdAt: string } | null;
  upcomingFromCoach?: number;
  invitations?: number;
};

function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function AthleteCard() {
  const { user } = useAuth();
  const profile = user?.profile || {};
  const facts: [string, string][] = [
    ["Goal", profile.goal ? GOAL_WORD[profile.goal] : "—"],
    [
      "Level",
      profile.experienceLevel
        ? profile.experienceLevel[0].toUpperCase() + profile.experienceLevel.slice(1)
        : "—",
    ],
    [
      "Trains",
      profile.trainingDaysPerWeek ? `${profile.trainingDaysPerWeek} days a week` : "—",
    ],
    ["Weight", profile.weightKg ? `${profile.weightKg} kg` : "—"],
    ["Height", profile.heightCm ? `${profile.heightCm} cm` : "—"],
    [
      "Setting",
      profile.trainingSetting
        ? SETTING_WORD[profile.trainingSetting] || profile.trainingSetting
        : "—",
    ],
    ["Budget", profile.budgetMonthlyInr ? `₹${profile.budgetMonthlyInr.toLocaleString("en-IN")}/mo` : "—"],
    ["When", profile.availability || "—"],
  ];
  const lists: [string, string[]][] = [
    ["Sports", profile.sports || []],
    ["Equipment", (profile.equipmentAccess || []).map((item) => item[0].toUpperCase() + item.slice(1))],
    ["Languages", profile.languages || []],
  ];
  const place = [profile.location?.area, profile.location?.city].filter(Boolean).join(", ");
  return (
    <section className="dash-side-card" aria-labelledby="dash-you">
      <div className="dash-person">
        <span className="dash-avatar" aria-hidden="true">
          {initialsOf(user?.name)}
        </span>
        <div>
          <h2 id="dash-you">{user?.name}</h2>
          <p>{[profile.sports?.[0], place].filter(Boolean).join(" · ") || "Athlete"}</p>
        </div>
      </div>
      <dl className="dash-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <dl className="dash-tags">
        {lists.map(([label, items]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {items.length ? (
                items.map((item) => <span key={item}>{item}</span>)
              ) : (
                <em>Not set</em>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {profile.about ? <p className="dash-side-note">{profile.about}</p> : null}
      {profile.injuries ? (
        <p className="dash-side-note">Injury note: {profile.injuries}</p>
      ) : null}
      <Link className="dash-link" to="/onboarding">
        Edit training profile
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

function CoachCard({ openThread }: { openThread: boolean }) {
  const { user } = useAuth();
  const [showThread, setShowThread] = useState(openThread);
  const coach = useQuery({
    queryKey: ["my-coach", user?._id],
    queryFn: async () => (await api.get("/my-coach")).data.data as MyCoach,
    enabled: Boolean(user?._id),
  });
  useEffect(() => {
    if (openThread) setShowThread(true);
  }, [openThread]);
  const data = coach.data;
  if (coach.isLoading) {
    return (
      <section className="dash-side-card" aria-labelledby="dash-coach">
        <h2 id="dash-coach">Your coach</h2>
        <p className="dash-side-note">Loading your coach…</p>
      </section>
    );
  }
  if (coach.isError) {
    return (
      <section className="dash-side-card" aria-labelledby="dash-coach">
        <h2 id="dash-coach">Your coach</h2>
        <p className="dash-side-note">
          Your coach could not be loaded.{" "}
          <button type="button" className="dash-inline-button" onClick={() => coach.refetch()}>
            Try again
          </button>
        </p>
      </section>
    );
  }
  if (!data?.coach) {
    return (
      <section className="dash-side-card dash-find-coach" aria-labelledby="dash-coach">
        <h2 id="dash-coach">Train with a coach</h2>
        <p>
          A coach assigns your sessions, reviews what you log and approves any
          change the AI suggests.
        </p>
        <Link className="primary-action dash-wide-action" to="/coaches">
          Find a coach near you
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
        {data?.invitations ? (
          <Link className="dash-link" to="/settings?section=invitations">
            {data.invitations === 1
              ? "1 coach invited you. Review it"
              : `${data.invitations} coaches invited you. Review them`}
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <Link className="dash-link" to="/marketplace">
            Browse coaching plans
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        )}
      </section>
    );
  }
  const { profile } = data;
  const name = data.coach.name;
  const first = name.split(" ")[0];
  return (
    <section className="dash-side-card dash-coach" aria-labelledby="dash-coach">
      <div className="dash-person">
        <span className="dash-avatar is-coach" aria-hidden="true">
          {initialsOf(name)}
        </span>
        <div>
          <h2 id="dash-coach">{name}</h2>
          <p>
            {profile?.headline ||
              [profile?.sport, profile?.city].filter(Boolean).join(" · ") ||
              "Your coach"}
          </p>
        </div>
      </div>
      <dl className="dash-facts">
        <div>
          <dt>Coaching you since</dt>
          <dd>
            {data.since
              ? new Date(data.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Sessions ahead</dt>
          <dd>{data.upcomingFromCoach ?? 0}</dd>
        </div>
      </dl>
      <div className="dash-coach-update">
        <h3>Latest from {first}</h3>
        {data.lastAssigned ? (
          <p>
            Assigned <strong>{data.lastAssigned.title}</strong> for{" "}
            {labelFromInstant(data.lastAssigned.date)}.
          </p>
        ) : (
          <p>No sessions assigned yet.</p>
        )}
        {data.lastMessage && !showThread && (
          <p className="dash-last-message">
            {String(data.lastMessage.senderId) === String(user?._id) ? "You: " : `${first}: `}
            {data.lastMessage.text}
          </p>
        )}
      </div>
      {showThread ? (
        <MessageThread
          endpoint="/my-coach/messages"
          selfId={user?._id || ""}
          otherName={first}
          placeholder={`Message ${first}…`}
          autoFocus={openThread}
        />
      ) : (
        <button
          type="button"
          className="primary-action dash-wide-action"
          onClick={() => setShowThread(true)}
        >
          <MessageSquare size={16} aria-hidden="true" />
          {data.unread
            ? `Message ${first} · ${data.unread} new`
            : `Message ${first}`}
        </button>
      )}
      {profile?.isPublic && (
        <Link className="dash-link" to={`/coaches/${data.coach._id}`}>
          View {first}’s profile
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

export default function AthleteHome() {
  const [planning, setPlanning] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [logTab, setLogTab] = useState<LogTab | null>(null);
  const companionPanel = useRef<HTMLDivElement>(null);
  const companionToggle = useRef<HTMLButtonElement>(null);
  const [params] = useSearchParams();
  const queries = useQueryClient();
  const { user } = useAuth();
  const homeQuery = useAthleteHome(user?._id);
  const workoutQuery = useAthleteWorkouts(user?._id);
  const insightsQuery = useAthleteInsights(user?._id);
  const performance = usePerformance();
  const reduced = useReducedMotion();
  const snapshot = performance.data as PerformanceSnapshot | undefined;
  const records = snapshot?.records || [];
  const readiness = snapshot?.readiness;
  const latest = records[0];
  const insights = insightsQuery.data;
  const home = homeQuery.data;
  const workouts = workoutQuery.data || [];
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const upcoming = workouts
    .filter(
      (workout) =>
        workout.status === "planned" && new Date(workout.date) >= start,
    )
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const todayKey = localKey(now);
  const todays = home?.todaysWorkout || null;
  const session = todays || upcoming[0] || null;
  const sessionIsToday = session
    ? localKey(new Date(session.date)) === todayKey
    : false;
  const rest = upcoming.filter((workout) => workout._id !== session?._id);
  const waiting = !user || homeQuery.isLoading || performance.isLoading;
  const reason =
    readiness?.reasons?.[0] ||
    "A score appears after a recent check-in.";
  const firstName = user?.name?.split(" ")[0] || "";
  const dayCopy = waiting
    ? "Loading today’s session and recovery."
    : !session
      ? "Nothing is scheduled today. Log a session you choose or draft a week."
      : sessionIsToday
        ? session.status === "completed"
          ? `${session.title} is logged. Recovery comes next.`
          : session.status === "skipped"
            ? `${session.title} was skipped today.`
            : `${session.title} is on the plan today.`
        : `Rest day. Next up is ${session.title}, ${labelFromInstant(session.date)}.`;
  const draft = async () => {
    setPlanning(true);
    try {
      const response = await api.post("/ai/plan");
      toast.success(
        response.data.data.coachApprovalRequired
          ? "Weekly draft sent for coach approval"
          : "Your training week is ready",
      );
      queries.invalidateQueries({ queryKey: ["performance"] });
      queries.invalidateQueries({ queryKey: ["athlete-workouts"] });
      queries.invalidateQueries({ queryKey: ["athlete-home"] });
    } catch {
      toast.error("Could not generate a training draft");
    } finally {
      setPlanning(false);
    }
  };
  useEffect(() => {
    if (!companionOpen) return;
    companionPanel.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCompanionOpen(false);
      companionToggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [companionOpen]);
  const source = session
    ? assignmentSource(session.assignedBy, user?._id)
    : null;
  const sleep = latest?.sleepMinutes;
  const stats: [string, string, string][] = [
    ["sleep", sleep != null ? formatSleep(sleep) : "—", "Last night’s sleep"],
    ["hrv", latest?.hrvMs != null ? `${latest.hrvMs} ms` : "—", "Heart rate variability"],
    [
      "rhr",
      latest?.restingHeartRate != null ? `${latest.restingHeartRate} bpm` : "—",
      "Resting heart rate",
    ],
    [
      "streak",
      home?.currentStreak != null
        ? `${home.currentStreak} ${home.currentStreak === 1 ? "day" : "days"}`
        : "—",
      "Training streak",
    ],
  ];
  return (
    <>
      <motion.div
        className="product-page day-page athlete-dash"
        initial={reduced ? false : { opacity: 0.7, transform: "translateY(8px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {performance.isError && (
          <div className="product-alert">
            Your performance data could not be loaded.{" "}
            <button onClick={() => performance.refetch()}>Try again</button>
          </div>
        )}
        <header className="dash-top">
          <div>
            <h1>
              {greetingFor(now)}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p>{dayCopy}</p>
          </div>
          <div className="dash-top-actions">
            <time dateTime={todayKey}>
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </time>
            <CheckInControl records={performance.isSuccess ? records : undefined} />
          </div>
        </header>
        <AthletePlanStrip />

        <div className="dash-layout">
          <div className="dash-board">
            <section className="dash-tile dash-session" aria-labelledby="dash-session-title">
              {homeQuery.isError && !session ? (
                <>
                  <h2 id="dash-session-title">Today’s session could not be loaded</h2>
                  <p className="dash-muted">Check your connection and try again.</p>
                  <button className="secondary-action" onClick={() => homeQuery.refetch()}>
                    Try again
                  </button>
                </>
              ) : homeQuery.isLoading || !user ? (
                <>
                  <h2 id="dash-session-title">Loading today’s session…</h2>
                  <p className="dash-muted">Your plan will appear here.</p>
                </>
              ) : session ? (
                <>
                  <p className="dash-tile-label">
                    {sessionIsToday ? "Today" : `Next · ${labelFromInstant(session.date)}`}
                    {source ? ` · ${source.label}` : ""}
                  </p>
                  <h2 id="dash-session-title">{session.title}</h2>
                  {session.items.length > 0 ? (
                    <ul className={`dash-moves${session.items.length > 3 ? " is-split" : ""}`}>
                      {session.items.slice(0, 5).map((item, index) => (
                        <li key={`${exerciseName(item)}-${index}`}>
                          <span>{exerciseName(item)}</span>
                          <span>
                            {item.sets}×{item.reps}
                          </span>
                        </li>
                      ))}
                      {session.items.length > 5 && (
                        <li className="dash-muted">{session.items.length - 5} more exercises</li>
                      )}
                    </ul>
                  ) : (
                    <p className="dash-muted">No exercises listed yet.</p>
                  )}
                  <div className="dash-session-actions">
                    {session.status === "completed" ? (
                      <Link className="secondary-action" to="/athlete/history">
                        See training
                        <ChevronRight size={16} />
                      </Link>
                    ) : (
                      <Link
                        className="primary-action"
                        to={`/athlete/log?workoutId=${session._id}`}
                      >
                        {session.status === "skipped" ? "Log session" : "Start session"}
                        <ChevronRight size={16} />
                      </Link>
                    )}
                    <Link className="secondary-action" to="/athlete/history">
                      Calendar
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="dash-tile-label">Today</p>
                  <h2 id="dash-session-title">No session planned</h2>
                  <p className="dash-muted">
                    Log a workout you choose, or let the AI draft a week for your coach to approve.
                  </p>
                  <div className="dash-session-actions">
                    <Link className="primary-action" to="/athlete/log">
                      Log workout
                      <ChevronRight size={16} />
                    </Link>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={draft}
                      disabled={planning}
                    >
                      {planning ? "Drafting your week…" : "Draft a week with AI"}
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="dash-tile dash-readiness" aria-labelledby="dash-ready-title">
              <h2 id="dash-ready-title" className="dash-tile-label">
                Readiness
              </h2>
              <ReadinessMark
                score={readiness?.score ?? null}
                status={readiness?.status || "missing"}
              />
              <p className="dash-muted">{performance.isLoading ? "Loading…" : reason}</p>
            </section>

            {stats.map(([key, value, label]) => (
              <section key={key} className="dash-tile dash-stat" aria-label={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </section>
            ))}

            <DayLogTile onLog={setLogTab} />

            <section className="dash-tile dash-wide" aria-labelledby="dash-sleep-title">
              <div className="dash-tile-head">
                <h2 id="dash-sleep-title">Sleep</h2>
                <button type="button" className="dash-link" onClick={() => setLogTab("sleep")}>
                  <Plus size={14} aria-hidden="true" />
                  Log sleep
                </button>
              </div>
              <SleepChart records={records} />
              <p className="chart-caption">
                {latest
                  ? `Latest: ${latest.sourceLabel || latest.source || "Record"}, ${labelFromKey(latest.date, true)}. Training-readiness estimate, not a medical assessment.`
                  : "No recovery record yet."}
              </p>
            </section>

            <section className="dash-tile dash-wide" aria-labelledby="dash-volume-title">
              <div className="dash-tile-head">
                <h2 id="dash-volume-title">Sets, last 7 days</h2>
                <span className="dash-muted">
                  {insightsQuery.isLoading
                    ? "…"
                    : insights?.attendance.sessionsPerWeek != null
                      ? `${insights.attendance.sessionsPerWeek} sessions a week`
                      : ""}
                </span>
              </div>
              {insightsQuery.isError ? (
                <p className="chart-caption">
                  Progress could not be loaded.{" "}
                  <button type="button" className="dash-inline-button" onClick={() => insightsQuery.refetch()}>
                    Try again
                  </button>
                </p>
              ) : (
                <VolumeList volume={insights?.volume7d} />
              )}
            </section>

            <section className="dash-tile dash-wide" aria-labelledby="dash-upcoming-title">
              <div className="dash-tile-head">
                <h2 id="dash-upcoming-title">Coming up</h2>
                <span className="dash-muted">
                  {workoutQuery.isLoading ? "Loading" : `${upcoming.length} planned`}
                </span>
              </div>
              {workoutQuery.isError ? (
                <p className="dash-muted">
                  Sessions could not be loaded.{" "}
                  <button type="button" className="dash-inline-button" onClick={() => workoutQuery.refetch()}>
                    Try again
                  </button>
                </p>
              ) : rest.length === 0 ? (
                <p className="dash-muted">
                  {session
                    ? "Nothing else on the calendar yet."
                    : "Sessions your coach assigns appear here."}
                </p>
              ) : (
                <ul className="dash-upcoming">
                  {rest.slice(0, 5).map((workout) => {
                    const origin = assignmentSource(workout.assignedBy, user?._id);
                    return (
                      <li key={workout._id}>
                        <Link to={`/athlete/log?workoutId=${workout._id}`}>
                          <time dateTime={localKey(new Date(workout.date))}>
                            {labelFromInstant(workout.date)}
                          </time>
                          <span>
                            <strong>{workout.title}</strong>
                            <span>
                              {origin.label} ·{" "}
                              {workout.items.length === 1
                                ? "1 exercise"
                                : `${workout.items.length} exercises`}
                            </span>
                          </span>
                          <ChevronRight size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {session && (
                <button
                  type="button"
                  className="dash-inline-button dash-draft"
                  onClick={draft}
                  disabled={planning}
                >
                  {planning ? "Drafting your week…" : "Draft next week with AI"}
                </button>
              )}
            </section>

            <section className="dash-tile" aria-labelledby="dash-revisit-title">
              <h2 id="dash-revisit-title">Needs a visit</h2>
              {insights?.neglectedMuscleGroups.length ? (
                <ul className="quiet-list">
                  {insights.neglectedMuscleGroups.slice(0, 4).map((entry) => (
                    <li key={entry.group}>
                      <span>{entry.group}</span>
                      <span>
                        {entry.daysSinceTrained == null
                          ? "Not recorded"
                          : `${entry.daysSinceTrained} days`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dash-muted">
                  {insightsQuery.isLoading
                    ? "Loading…"
                    : "Recent training covers your tracked groups."}
                </p>
              )}
            </section>

            <section className="dash-tile" aria-labelledby="dash-bests-title">
              <h2 id="dash-bests-title">Personal bests</h2>
              {insights?.personalBests.length ? (
                <ul className="quiet-list">
                  {insights.personalBests.slice(0, 4).map((best) => (
                    <li key={best.exercise.slug}>
                      <Link to={`/exercises/${best.exercise.slug}`}>
                        {best.exercise.name}
                      </Link>
                      <span>{best.weightKg} kg</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dash-muted">
                  {insightsQuery.isLoading
                    ? "Loading…"
                    : "Log a weight to start a personal best."}
                </p>
              )}
            </section>
          </div>

          <aside className="dash-side" aria-label="You and your coach">
            <CoachCard openThread={params.get("coach") === "messages"} />
            <AthleteCard />
          </aside>
        </div>
      </motion.div>
      {logTab && (
        <DailyLogDialog initialTab={logTab} onClose={() => setLogTab(null)} />
      )}
      <div className={`day-companion${companionOpen ? " is-open" : ""}`}>
        <div
          ref={companionPanel}
          id="day-companion-panel"
          className="day-companion-panel"
          role="dialog"
          aria-label="Training companion"
          hidden={!companionOpen}
          tabIndex={-1}
        >
          <TrainingCompanion />
        </div>
        <button
          ref={companionToggle}
          type="button"
          className="day-companion-toggle"
          aria-expanded={companionOpen}
          aria-controls="day-companion-panel"
          onClick={() => setCompanionOpen((open) => !open)}
        >
          {companionOpen ? <X size={16} /> : <Sparkles size={16} />}
          {companionOpen ? "Close" : "AI coach"}
        </button>
      </div>
    </>
  );
}
