import { useState } from "react";
import { api } from "../../services/api";
import { useParams, Link } from "react-router-dom";
import { WeeklyDragBoard } from "../../components/coach/WeeklyDragBoard";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
import { InsightsPanel } from "../../components/workout/InsightsPanel";

export default function AthleteDetailPage() {
  const { athleteId } = useParams();
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const summarize = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/ai/summary/${athleteId}`);
      setSummary(r.data.data.summary);
    } catch {
      setSummary(
        "Summary unavailable. Check Gemini configuration and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!athleteId) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/coach" className="text-sm underline">
        ← Back to athletes
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Athlete overview
      </h1>

      <section className="mt-6">
        <button
          onClick={summarize}
          disabled={busy}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          {busy ? "Preparing summary…" : "Summarize this week"}
        </button>
        {summary && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
            {summary}
          </p>
        )}
      </section>
      <div className="mt-6 fp-surface rounded-lg p-4">
        <h2 className="font-semibold">This week (drag to reschedule)</h2>
        <div className="mt-3">
          <WeeklyDragBoard athleteId={athleteId} />
        </div>
      </div>

      <div className="mt-6 fp-surface rounded-lg p-4">
        <MonthCalendar athleteId={athleteId} />
      </div>

      <div className="mt-6">
        <InsightsPanel athleteId={athleteId} canViewOnModel={false} />
      </div>
    </div>
  );
}
