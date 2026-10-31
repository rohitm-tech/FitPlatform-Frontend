import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAthleteInsights } from "../../queries/useAthlete";
import { useMuscles } from "../../queries/useMuscles";
import { useAppDispatch } from "../../store/hooks";
import { setHeatData } from "../../store/slices/explorerSlice";
export function InsightsPanel({
  athleteId,
  canViewOnModel = true,
}: {
  athleteId: string | undefined;
  canViewOnModel?: boolean;
}) {
  const query = useAthleteInsights(athleteId);
  const { data: muscles } = useMuscles();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState("");
  const data = query.data;
  if (query.isLoading)
    return (
      <div className="page-state" role="status">
        Loading training insights…
      </div>
    );
  if (query.isError || !data)
    return (
      <div className="page-state page-state-error" role="alert">
        <h2>Progress couldn’t be loaded.</h2>
        <p>Check your connection or account access and try again.</p>
        <button onClick={() => query.refetch()}>Retry</button>
      </div>
    );
  const groups = [
    ...new Set([...Object.keys(data.volume7d), ...Object.keys(data.volume14d)]),
  ];
  const balance = groups.map((group) => ({
    group,
    "Last 7 days": data.volume7d[group] || 0,
    "Last 14 days": data.volume14d[group] || 0,
  }));
  const trendGroups = [
    ...new Set(data.volumeTrend.flatMap((w) => Object.keys(w))),
  ];
  const group = selectedGroup || trendGroups[0] || "";
  const trend = data.volumeTrend.map((week, i) => ({
    week: `W${i + 1}`,
    sets: week[group] || 0,
  }));
  const view = () => {
    if (!muscles) return;
    const heat: Record<string, number> = {};
    for (const entry of data.neglectedMuscleGroups) {
      const intensity = Math.min(1, (entry.daysSinceTrained ?? 14) / 14);
      muscles
        .filter((m) => m.group === entry.group)
        .forEach((m) => {
          heat[m.key] = intensity;
        });
    }
    dispatch(setHeatData(heat));
    navigate("/athlete/explorer");
  };
  return (
    <div className="page-stack">
      <div className="stat-strip">
        <div>
          <strong>{data.attendance.sessionsPerWeek}</strong>
          <span>Sessions / week</span>
        </div>
        <div>
          <strong>{data.attendance.longestStreak}</strong>
          <span>Longest streak · days</span>
        </div>
        <div>
          <strong>{data.attendance.totalSessions}</strong>
          <span>Sessions · last 8 weeks</span>
        </div>
      </div>
      <div className="chart-grid">
        <section className="page-section">
          <h2>Muscle-group volume</h2>
          <p>Recorded sets. The 14-day window includes the last 7 days.</p>
          {balance.length ? (
            <>
              <div
                className="chart-container"
                role="img"
                aria-label="Recorded sets per muscle group over 7 and 14 days"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={balance}
                    margin={{ top: 8, right: 8, left: -18, bottom: 8 }}
                    accessibilityLayer
                  >
                    <CartesianGrid vertical={false} stroke="#ebe6ef" />
                    <XAxis
                      dataKey="group"
                      tick={{ fontSize: 11, fill: "#716779" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#716779" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="Last 7 days"
                      fill="#77518b"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="Last 14 days"
                      fill="#c8b7d2"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="insight-table">
                <summary>View volume as a table</summary>
                <div className="table-frame">
                  <table>
                    <thead>
                      <tr>
                        <th>Muscle group</th>
                        <th className="num">7 days</th>
                        <th className="num">14 days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balance.map((row) => (
                        <tr key={row.group}>
                          <td>{row.group}</td>
                          <td className="num">{row["Last 7 days"]}</td>
                          <td className="num">{row["Last 14 days"]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <p className="empty-copy">
              No sets recorded in this window. Log a session to start seeing
              volume.
            </p>
          )}
        </section>
        <section className="page-section">
          <div className="section-row">
            <h2>Weekly volume trend</h2>
            <label className="sr-only" htmlFor={`trend-group-${athleteId}`}>
              Muscle group for weekly trend
            </label>
            <select
              id={`trend-group-${athleteId}`}
              className="fp-input trend-select"
              value={group}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!trendGroups.length}
            >
              {trendGroups.length ? (
                trendGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))
              ) : (
                <option>No groups yet</option>
              )}
            </select>
          </div>
          <p>Recorded sets across 8 weekly buckets, oldest to newest.</p>
          {trendGroups.length ? (
            <>
              <div
                className="chart-container"
                role="img"
                aria-label={`${group} recorded sets by week`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trend}
                    margin={{ top: 8, right: 12, left: -18, bottom: 8 }}
                    accessibilityLayer
                  >
                    <CartesianGrid vertical={false} stroke="#ebe6ef" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#716779" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#716779" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Line
                      type="linear"
                      dataKey="sets"
                      name="Recorded sets"
                      stroke="#77518b"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details className="insight-table">
                <summary>View weekly sets</summary>
                <ul>
                  {trend.map((row) => (
                    <li key={row.week}>
                      {row.week}
                      <span>{row.sets} sets</span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <p className="empty-copy">No weekly training history yet.</p>
          )}
        </section>
      </div>
      <div className="two-column-page">
        <section className="page-section">
          <div className="section-row">
            <h2>Muscles to revisit</h2>
            {canViewOnModel && (
              <button className="row-action" onClick={view}>
                View on model
              </button>
            )}
          </div>
          <p>Groups with a gap in your recorded training.</p>
          <ul className="data-list mt-3">
            {data.neglectedMuscleGroups.map((entry) => (
              <li key={entry.group} className="section-row">
                <span className="capitalize">{entry.group}</span>
                <span className="text-sm text-slate-400">
                  {entry.daysSinceTrained === null
                    ? "Not recorded yet"
                    : `${entry.daysSinceTrained} days since training`}
                </span>
              </li>
            ))}
          </ul>
          {!data.neglectedMuscleGroups.length && (
            <p className="empty-copy">
              All tracked muscle groups have recent training.
            </p>
          )}
        </section>
        <section className="page-section">
          <h2>Personal bests</h2>
          <p>Highest recorded load per movement.</p>
          <ul className="data-list mt-3">
            {data.personalBests.slice(0, 10).map((pb) => (
              <li key={pb.exercise.slug}>
                <div className="section-row">
                  <Link
                    className="text-sm font-medium"
                    to={`/exercises/${pb.exercise.slug}`}
                  >
                    {pb.exercise.name}
                  </Link>
                  <strong className="tabular-nums">{pb.weightKg} kg</strong>
                </div>
                <p className="section-note">
                  {new Date(pb.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
          {!data.personalBests.length && (
            <p className="empty-copy">
              Log your sets and weights to start tracking personal bests.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
