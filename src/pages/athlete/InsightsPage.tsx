import { useAuth } from "../../hooks/useAuth";
import { InsightsPanel } from "../../components/workout/InsightsPanel";
export default function InsightsPage() {
  const { user } = useAuth();
  return (
    <div className="product-page">
      <div className="page-greeting">
        <div>
          <h1>Your progress</h1>
          <p>
            Training volume, consistency and personal bests from your recorded
            sessions.
          </p>
        </div>
      </div>
      <InsightsPanel athleteId={user?._id} />
    </div>
  );
}
