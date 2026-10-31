import { useAuth } from '../../hooks/useAuth';

export default function GymHome() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Gym dashboard</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        {user?.name}, member/check-in analytics and kiosk management land in Phase 5.
      </p>
    </div>
  );
}
