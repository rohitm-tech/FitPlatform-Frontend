import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
export default function AiCoachPanel() {
  const queries = useQueryClient();
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const run = async (kind: "plan" | "chat" | "nudge") => {
    setLoading(true);
    try {
      const r = await api.post(
        `/ai/${kind}`,
        kind === "chat" ? { message } : {},
      );
      const d = r.data.data;
      if (kind === "plan") {
        setAnswer(
          `${d.workouts?.length || 0} workouts added to your week.${d.painNotice ? ` ${d.painNotice}` : ""}`,
        );
        queries.invalidateQueries({ queryKey: ["athlete-workouts"] });
        queries.invalidateQueries({ queryKey: ["athlete-home"] });
        toast.success("Your week is ready");
      } else setAnswer(kind === "chat" ? d.answer : d.text);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "AI coach is unavailable");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="mt-5 fp-surface rounded-xl p-5">
      <div>
        <h2 className="mt-1 font-semibold">AI coach</h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={loading}
          onClick={() => run("plan")}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
        >
          Generate my week
        </button>
        <button
          disabled={loading}
          onClick={() => run("nudge")}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Motivate me
        </button>
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) run("chat");
        }}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Ask the AI coach about your training"
          placeholder="Ask about your training"
          className="fp-input flex-1"
        />
        <button disabled={loading} className="rounded-lg border px-4 text-sm">
          Ask
        </button>
      </form>
      {answer && <p className="mt-3 whitespace-pre-wrap text-sm">{answer}</p>}
      <p className="mt-3 text-xs text-slate-500">
        AI guidance is general fitness information. For pain or injury, consult
        a doctor or physiotherapist.
      </p>
    </section>
  );
}
