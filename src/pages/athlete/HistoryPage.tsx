import { useAuth } from '../../hooks/useAuth';
import { MonthCalendar } from '../../components/workout/MonthCalendar';

export default function HistoryPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <MonthCalendar athleteId={user?._id} />
    </div>
  );
}
