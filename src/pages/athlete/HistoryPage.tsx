import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
export default function HistoryPage() {
  const { user } = useAuth();
  return (
    <div className="product-page">
      <div className="page-greeting">
        <div>
          <h1>Your training</h1>
          <p>See what’s planned, revisit completed sessions and keep moving.</p>
        </div>
        <Link className="primary-action" to="/athlete/log">
          Log a workout
        </Link>
      </div>
      <MonthCalendar athleteId={user?._id} />
    </div>
  );
}
