import { useAuth } from '../../hooks/useAuth';

export default function AthleteHome() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Welcome back, {user?.name}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        The 3D muscle explorer, workout logger, and insights land in Phase 2–3.
      </p>
    </div>
  );
}
