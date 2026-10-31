import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useAthleteInsights } from '../../queries/useAthlete';
import { useMuscles } from '../../queries/useMuscles';
import { useAppDispatch } from '../../store/hooks';
import { setHeatData } from '../../store/slices/explorerSlice';

const GROUP_COLORS: Record<string, string> = {
  chest: '#38bdf8',
  back: '#a78bfa',
  shoulders: '#f59e0b',
  arms: '#34d399',
  legs: '#f472b6',
  core: '#fbbf24',
};

export function InsightsPanel({ athleteId, canViewOnModel = true }: { athleteId: string | undefined; canViewOnModel?: boolean }) {
  const { data, isLoading } = useAthleteInsights(athleteId);
  const { data: muscles } = useMuscles();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <div className="p-8 text-sm" style={{ color: 'var(--fp-text-muted)' }}>Loading…</div>;
  }

  const groupKeys = [...new Set([...Object.keys(data.volume7d), ...Object.keys(data.volume14d)])];
  const balanceChartData = groupKeys.map((group) => ({
    group,
    '7 days': data.volume7d[group] || 0,
    '14 days': data.volume14d[group] || 0,
  }));

  const trendChartData = data.volumeTrend.map((week, i) => ({ week: `W${i + 1}`, ...week }));
  const trendGroups = [...new Set(data.volumeTrend.flatMap((w) => Object.keys(w)))];

  const viewOnModel = () => {
    if (!muscles) return;
    const heatData: Record<string, number> = {};
    for (const entry of data.neglectedMuscleGroups) {
      const intensity = Math.min(1, (entry.daysSinceTrained ?? 14) / 14);
      muscles.filter((m) => m.group === entry.group).forEach((m) => {
        heatData[m.key] = intensity;
      });
    }
    dispatch(setHeatData(heatData));
    navigate('/athlete/explorer');
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <div className="fp-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold">{data.attendance.sessionsPerWeek}</p>
          <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Sessions / week</p>
        </div>
        <div className="fp-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold">{data.attendance.longestStreak}</p>
          <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Longest streak (days)</p>
        </div>
        <div className="fp-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold">{data.attendance.totalSessions}</p>
          <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Sessions (8wk)</p>
        </div>
      </div>

      <div className="mt-6 fp-surface rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Neglected muscle groups</h2>
          {canViewOnModel && (
            <button className="text-xs underline" onClick={viewOnModel}>View on 3D model</button>
          )}
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {data.neglectedMuscleGroups.map((entry) => (
            <li key={entry.group} className="capitalize">
              {entry.group}: {entry.daysSinceTrained === null ? 'never trained' : `not trained in ${entry.daysSinceTrained} days`}
            </li>
          ))}
          {data.neglectedMuscleGroups.length === 0 && (
            <li style={{ color: 'var(--fp-text-muted)' }}>Nothing neglected — nice work!</li>
          )}
        </ul>
      </div>

      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">Muscle-group balance (sets)</h2>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceChartData}>
              <XAxis dataKey="group" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="7 days" fill="#38bdf8" />
              <Bar dataKey="14 days" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">Weekly volume trend</h2>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {trendGroups.map((group) => (
                <Line key={group} type="monotone" dataKey={group} stroke={GROUP_COLORS[group] || '#999'} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">Personal bests</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {data.personalBests.slice(0, 10).map((pb) => (
            <li key={pb.exercise.slug}>
              {pb.exercise.name}: {pb.weightKg} kg
            </li>
          ))}
          {data.personalBests.length === 0 && (
            <li style={{ color: 'var(--fp-text-muted)' }}>Log some workouts to see personal bests.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
