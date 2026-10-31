import { useMemo, useState } from 'react';
import { useAthleteWorkouts } from '../../queries/useAthlete';
import type { WorkoutStatus } from '../../types/domain';

const STATUS_COLOR: Record<WorkoutStatus, string> = {
  completed: '#22c55e',
  skipped: '#ef4444',
  planned: '#6b7280',
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function MonthCalendar({ athleteId }: { athleteId: string | undefined }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const viewedMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const from = startOfMonth(viewedMonth).toISOString();
  const to = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0, 23, 59).toISOString();
  const { data: workouts } = useAthleteWorkouts(athleteId, { from, to });

  const byDay = useMemo(() => {
    const map = new Map<number, WorkoutStatus>();
    workouts?.forEach((w) => map.set(new Date(w.date).getDate(), w.status));
    return map;
  }, [workouts]);

  const firstWeekday = startOfMonth(viewedMonth).getDay();
  const total = daysInMonth(viewedMonth);
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          {viewedMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: 'var(--fp-border)' }} onClick={() => setMonthOffset((m) => m - 1)}>←</button>
          <button className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: 'var(--fp-border)' }} onClick={() => setMonthOffset((m) => m + 1)}>→</button>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-xs">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {status}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs" style={{ color: 'var(--fp-text-muted)' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const status = day ? byDay.get(day) : undefined;
          return (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-lg text-sm"
              style={{
                background: status ? STATUS_COLOR[status] + '33' : 'var(--fp-surface)',
                border: `1px solid ${status ? STATUS_COLOR[status] : 'var(--fp-border)'}`,
              }}
            >
              {day ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
