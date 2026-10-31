import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
export default function HistoryPage() {
  const { user } = useAuth();
  return (
    <div className="product-page">
      <div className="page-top-actions">
        <Link className="primary-action" to="/athlete/log">
          Log a workout
        </Link>
      </div>
      <MonthCalendar athleteId={user?._id} />
    </div>
  );
}
