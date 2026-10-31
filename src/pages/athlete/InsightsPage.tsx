import { useAuth } from '../../hooks/useAuth';
import { InsightsPanel } from '../../components/workout/InsightsPanel';

export default function InsightsPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Insights</h1>
      <div className="mt-6">
        <InsightsPanel athleteId={user?._id} />
      </div>
    </div>
  );
}
