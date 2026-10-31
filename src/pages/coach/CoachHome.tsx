import { useAuth } from '../../hooks/useAuth';

export default function CoachHome() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Coach dashboard</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        {user?.name}, your athlete list and workout builder land in Phase 4.
      </p>
    </div>
  );
}
