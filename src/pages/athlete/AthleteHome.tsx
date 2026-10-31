import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAthleteHome } from '../../queries/useAthlete';

export default function AthleteHome() {
  const { user } = useAuth();
  const { data, isLoading } = useAthleteHome(user?._id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Welcome back, {user?.name}</h1>

      {!isLoading && data && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="fp-surface rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold">{data.currentStreak}</p>
            <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Day streak</p>
          </div>
          <div className="fp-surface rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold">{data.daysSinceLastWorkout ?? '—'}</p>
            <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Days since last workout</p>
          </div>
          <div className="fp-surface rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold">{data.todaysWorkout ? '✓' : '—'}</p>
            <p className="text-xs" style={{ color: 'var(--fp-text-muted)' }}>Workout today</p>
          </div>
        </div>
      )}

      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">Today's workout</h2>
        {isLoading ? (
          <p className="mt-2 text-sm" style={{ color: 'var(--fp-text-muted)' }}>Loading…</p>
        ) : data?.todaysWorkout ? (
          <div className="mt-2">
            <p className="text-sm">{data.todaysWorkout.title}</p>
            {data.todaysWorkout.status === 'planned' ? (
              <Link
                to={`/athlete/log?workoutId=${data.todaysWorkout._id}`}
                className="mt-3 inline-block rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--fp-border)' }}
              >
                Start workout
              </Link>
            ) : (
              <p className="mt-2 text-sm capitalize" style={{ color: 'var(--fp-text-muted)' }}>
                {data.todaysWorkout.status} ✓
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>Nothing planned for today.</p>
            <Link
              to="/athlete/log"
              className="mt-3 inline-block rounded-lg border px-4 py-2 text-sm"
              style={{ borderColor: 'var(--fp-border)' }}
            >
              Start a blank workout
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/athlete/explorer" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          3D Muscle Explorer
        </Link>
        <Link to="/exercises" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          Exercise Library
        </Link>
        <Link to="/athlete/history" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          History
        </Link>
        <Link to="/athlete/insights" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          Insights
        </Link>
      </div>
    </div>
  );
}
