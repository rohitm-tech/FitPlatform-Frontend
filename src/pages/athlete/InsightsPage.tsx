import { useAuth } from "../../hooks/useAuth";
import { InsightsPanel } from "../../components/workout/InsightsPanel";
export default function InsightsPage() {
  const { user } = useAuth();
  return (
    <div className="product-page">
      <InsightsPanel athleteId={user?._id} />
    </div>
  );
}
