import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AthleteHome() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Welcome back, {user?.name}</h1>
      <div className="mt-4 flex gap-3">
        <Link to="/athlete/explorer" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          3D Muscle Explorer
        </Link>
        <Link to="/exercises" className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--fp-border)' }}>
          Exercise Library
        </Link>
      </div>
      <p className="mt-4 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        The workout logger, history, and insights dashboard land next (Phase 3).
      </p>
    </div>
  );
}
