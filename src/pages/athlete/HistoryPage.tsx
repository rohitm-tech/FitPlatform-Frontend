import { useAuth } from "../../hooks/useAuth";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
export default function HistoryPage() {
  const { user } = useAuth();
  return (
    <div className="product-page">
      <MonthCalendar athleteId={user?._id} />
    </div>
  );
}
