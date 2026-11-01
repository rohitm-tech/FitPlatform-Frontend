import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  ShieldCheck,
  Clock3,
  Plus,
  Search,
  X,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCoachPerformance } from "../../queries/usePerformance";
import { useMyAthletes, useInviteAthlete } from "../../queries/useCoach";
import { api } from "../../services/api";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
import { MessageThread } from "../../components/common/MessageThread";
import { CoachRateStrip } from "../../components/billing/PlanStrip";
import "../../dashboard.css";
export default function CoachHome() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useCoachPerformance();
  const { data: roster } = useMyAthletes();
  const invite = useInviteAthlete();
  const query = useQueryClient();
  const reduced = useReducedMotion();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("athlete") || "");
  useEffect(() => {
    if (params.get("athlete")) {
      setSelected(params.get("athlete")!);
      setFilter("all");
      setSearch("");
    }
  }, [params.get("athlete")]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [email, setEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  useEffect(() => {
    if (params.get("invite") === "1") setShowInvite(true);
  }, [params.get("invite")]);
  const [busy, setBusy] = useState(false);
  const earnings = useQuery({
    queryKey: ["coach-earnings", user?._id],
    queryFn: async () => (await api.get("/billing/coach-earnings")).data.data,
    enabled: Boolean(user?._id),
  });
  const pricing = useQuery({
    queryKey: ["billing-pricing"],
    queryFn: async () => (await api.get("/billing/pricing")).data.data,
  });
  const rupees = (minor?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format((minor || 0) / 100);
  const [chatOpen, setChatOpen] = useState(false);
  const all = data?.athletes || [];
  const rows = all.filter(
    (r: any) =>
      r.athlete.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || r.review?.approval === "pending"),
  );
  const active =
    all.find((r: any) => String(r.athlete._id) === selected) ||
    rows[0] ||
    all[0];
  const pending = all.filter(
    (r: any) => r.review?.approval === "pending",
  ).length;
  const attention = all.filter(
    (r: any) => r.readiness.score != null && r.readiness.score < 50,
  ).length;
  const decision = async (value: "approve" | "decline") => {
    setBusy(true);
    try {
      await api.post(`/performance/reviews/${active.review._id}/decision`, {
        decision: value,
      });
      toast.success(
        value === "approve"
          ? active.review.analysis?.planDraft
            ? "Draft saved to your templates"
            : "Adjustment approved"
          : "Original plan retained",
      );
      query.invalidateQueries({ queryKey: ["coach-performance"] });
      query.invalidateQueries({ queryKey: ["athlete-workouts"] });
      query.invalidateQueries({ queryKey: ["templates"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Could not save decision");
    } finally {
      setBusy(false);
    }
  };
  return (
    <motion.div
      className="product-page"
      initial={reduced ? false : { opacity: 0.7, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.3 }}
    >
      <header className="coach-summary">
        <div className="coach-summary-metrics">
          <div>
            <strong>{all.length}</strong>
            <span>Active athletes</span>
          </div>
          <div>
            <strong>{pending}</strong>
            <span>Awaiting your approval</span>
          </div>
          <div>
            <strong>{attention}</strong>
            <span>Recovery needs attention</span>
          </div>
          <div>
            <strong>{earnings.data ? rupees(earnings.data.netMinor) : "—"}</strong>
            <span>
              {earnings.data
                ? `You keep. Company keeps ${rupees(earnings.data.feeMinor)} of ${rupees(earnings.data.grossMinor)}`
                : "You keep"}
            </span>
          </div>
        </div>
        <div className="coach-summary-side">
          <div className="coach-summary-actions">
            <button
              className="secondary-action"
              onClick={() => setShowInvite(!showInvite)}
            >
              <Plus size={16} />
              Invite athlete
            </button>
            <Link to="/coach/explore" className="secondary-action">
              Explore athletes
            </Link>
            <Link to="/coach/builder" className="primary-action">
              Build a session <ArrowUpRight size={15} />
            </Link>
          </div>
          <p className="coach-summary-note">
            <ShieldCheck size={16} />
            AI reviews the evidence. You make the training decision.
          </p>
          <CoachRateStrip
            inviteMinor={pricing.data?.coachInviteFeeMinor}
            freeChatMinor={pricing.data?.freeCoachChatFeeMinor}
            chatMinor={pricing.data?.coachChatFeeMinor}
            feePercent={pricing.data?.coachEarningsFeePercent}
          />
        </div>
      </header>
      {showInvite && (
        <form
          className="invite-strip"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await invite.mutateAsync(email);
              toast.success(
                pricing.data
                  ? `Invitation sent. ${rupees(pricing.data.coachInviteFeeMinor)} invite fee recorded.`
                  : "Invitation sent to the athlete’s account",
              );
              setEmail("");
              setShowInvite(false);
            } catch {
              toast.error("Use an existing athlete account email");
            }
          }}
        >
          <label htmlFor="invite-athlete">
            Invite an athlete
            {pricing.data ? ` · ${rupees(pricing.data.coachInviteFeeMinor)} is recorded when you send it` : ""}
          </label>
          <input
            id="invite-athlete"
            type="email"
            required
            className="fp-input"
            value={email}
            placeholder="athlete@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary-action" disabled={invite.isPending}>
            Send invite
          </button>
        </form>
      )}
      {isError && (
        <div className="product-alert">
          Could not load your team.{" "}
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}
      <div className="coach-grid">
        <section className="work-panel roster-panel">
          <div className="roster-toolbar">
            <div className="filter-tabs">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                Your athletes
              </button>
              <button
                className={filter === "review" ? "active" : ""}
                onClick={() => setFilter("review")}
              >
                Needs review <span>{pending}</span>
              </button>
            </div>
            <label className="athlete-search">
              <Search size={16} />
              <input
                aria-label="Search athletes"
                value={search}
                placeholder="Find an athlete"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="table-scroll">
            <table className="product-table athlete-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Recovery</th>
                  <th>Training</th>
                  <th>Review</th>
                  <th>Chat</th>
                  <th>Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const old = roster?.athletes.find(
                    (a: any) => a.athlete._id === r.athlete._id,
                  );
                  const unread = old?.unread || 0;
                  return (
                    <tr
                      key={r.athlete._id}
                      className={
                        active?.athlete._id === r.athlete._id
                          ? "selected-row"
                          : ""
                      }
                    >
                      <td>
                        <button
                          className="athlete-name"
                          onClick={() => {
                            setSelected(r.athlete._id);
                            setChatOpen(false);
                          }}
                        >
                          <span className="initial-avatar">
                            {r.athlete.name
                              .split(" ")
                              .map((s: string) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <span>
                            <strong>{r.athlete.name}</strong>
                            <small>{r.athlete.email}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className={`readiness-tag ${r.readiness.status}`}>
                          {r.readiness.score ?? "—"}
                        </span>
                        <small>{r.readiness.status}</small>
                      </td>
                      <td>
                        <strong>{old?.sessionsThisWeek ?? 0} sessions</strong>
                        <small>{old?.skippedCount ?? 0} skipped · 14d</small>
                      </td>
                      <td>
                        <span
                          className={`review-badge ${r.review?.approval === "pending" ? "pending" : ""}`}
                        >
                          {r.review?.approval === "pending"
                            ? "Approval needed"
                            : r.review?.status === "ready"
                              ? "Reviewed"
                              : r.review?.status || "No review"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`roster-chat${unread ? " has-unread" : ""}`}
                          aria-label={
                            unread
                              ? `Open chat with ${r.athlete.name}, ${unread} new`
                              : `Open chat with ${r.athlete.name}`
                          }
                          onClick={() => {
                            setSelected(r.athlete._id);
                            setChatOpen(true);
                          }}
                        >
                          <MessageCircle size={15} />
                          Chat
                          {unread > 0 && (
                            <span className="unread-count">{unread}</span>
                          )}
                        </button>
                      </td>
                      <td>
                        <Link
                          className="roster-chat"
                          to={`/coach/athletes/${r.athlete._id}`}
                        >
                          Visit dashboard
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isLoading && <p className="panel-body">Loading athlete data…</p>}
            {!isLoading && !rows.length && (
              <p className="panel-body">
                {filter === "review"
                  ? "No approvals waiting. Your queue is clear."
                  : "No athletes are assigned to you yet. Invite an athlete to begin."}
              </p>
            )}
          </div>
          <div className="roster-footer">
            <Clock3 size={14} />
            Recovery updates and logged workouts trigger reviews automatically.
          </div>
        </section>
        <aside className="work-panel coach-review">
          <div className="section-heading">
            <div>
              <h2>
                {active
                  ? chatOpen
                    ? `Chat with ${active.athlete.name.split(" ")[0]}`
                    : active.athlete.name
                  : "Athlete review"}
              </h2>
              <p>
                {chatOpen
                  ? "Messages with an athlete assigned to you"
                  : "Readiness and the next training decision"}
              </p>
            </div>
            {active && (
              <button
                type="button"
                className="text-action"
                onClick={() => setChatOpen((open) => !open)}
              >
                {chatOpen ? "Review" : "Chat"}
              </button>
            )}
          </div>
          {active && chatOpen ? (
            <div className="panel-body">
              <MessageThread
                endpoint={`/coach/athletes/${active.athlete._id}/messages`}
                selfId={user?._id || ""}
                otherName={active.athlete.name.split(" ")[0]}
                placeholder={`Write to ${active.athlete.name.split(" ")[0]}…`}
                autoFocus
                onSeen={() =>
                  query.invalidateQueries({ queryKey: ["coach-athletes"] })
                }
              />
            </div>
          ) : active ? (
            <div className="panel-body">
              <div className="review-profile">
                <span className={`readiness-tag ${active.readiness.status}`}>
                  {active.readiness.score ?? "—"} / 100
                </span>
                <span>Latest readiness</span>
              </div>
              {active.readiness.reasons.map((reason: string) => (
                <p className="review-observation" key={reason}>
                  <Check size={14} />
                  {reason}
                </p>
              ))}
              {active.latest ? (
                <div className="coach-sleep">
                  <strong>
                    {active.latest.sleepMinutes != null
                      ? `${Math.floor(active.latest.sleepMinutes / 60)}h ${active.latest.sleepMinutes % 60}m`
                      : "—"}
                  </strong>
                  <span>Sleep · {active.latest.sourceLabel}</span>
                </div>
              ) : (
                <p className="small-note">
                  Detailed recovery readings stay private unless this athlete
                  enables sharing. Summary readiness is available here.
                </p>
              )}
              <div className="review-evidence">
                <h3>Automatic review</h3>
                <p>
                  {active.review?.analysis?.summary ||
                    "No completed review yet. New records will trigger one automatically."}
                </p>
                {active.review?.analysis?.observations?.map((o: string) => (
                  <p key={o} className="review-observation">
                    <Check size={13} />
                    {o}
                  </p>
                ))}
                {active.review?.rules?.completion?.coverage != null && (
                  <p>
                    {active.review.rules.completion.coverage}% of logged
                    assignment targets met.
                  </p>
                )}
                <span className="status-pill">
                  {active.review?.aiStatus === "ready"
                    ? "Gemini + safety rules"
                    : active.review?.status === "queued" ||
                        active.review?.status === "processing"
                      ? "Review running"
                      : "Rules review"}
                </span>
              </div>
              {active.review?.analysis && (
                <div className="proposed-change">
                  <h3>
                    {active.review.analysis.planDraft
                      ? "Proposed: weekly training plan"
                      : active.review.analysis.recommendation === "keep"
                        ? "Keep the plan"
                        : active.review.analysis.recommendation === "rest"
                          ? "Proposed: recovery day"
                          : "Proposed: lower training volume"}
                  </h3>
                  <p>{active.review.analysis.reason}</p>
                  {active.review.workoutId?.title && (
                    <div className="target-session">
                      <strong>{active.review.workoutId.title}</strong>
                      <p>
                        {new Date(
                          active.review.workoutId.date,
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <details>
                        <summary>Review session targets</summary>
                        {active.review.workoutId.items.map(
                          (i: any, n: number) => (
                            <p key={n}>
                              {i.exerciseId?.name || "Exercise"} · {i.sets} sets
                              {active.review.analysis.recommendation ===
                              "reduce"
                                ? ` → ${Math.max(1, Math.floor(i.sets * 0.7))} sets`
                                : ""}{" "}
                              × {i.reps} reps
                            </p>
                          ),
                        )}
                      </details>
                    </div>
                  )}
                  {active.review.analysis.planDraft && (
                    <div className="plan-draft-preview">
                      {active.review.analysis.planDraft.map((w: any) => (
                        <details key={w.day}>
                          <summary>
                            {w.title} · {w.items.length} exercises
                          </summary>
                          {w.items.map((i: any) => (
                            <p key={i.exerciseId}>
                              {i.exerciseName || "Library exercise"} · {i.sets}{" "}
                              × {i.reps}
                            </p>
                          ))}
                        </details>
                      ))}
                      <p className="small-note">
                        Approval saves these sessions to your templates. Use the
                        workout builder to assign them to the calendar; existing
                        assignments stay in place.
                      </p>
                      <Link className="text-action" to="/coach/builder">
                        Open workout builder
                      </Link>
                    </div>
                  )}
                  {active.review.approval === "pending" ? (
                    <div className="approval-actions">
                      <button
                        disabled={
                          busy ||
                          (!active.review.analysis.planDraft &&
                            String(active.review.workoutId?.assignedBy) !==
                              String(user?._id))
                        }
                        className="primary-action"
                        onClick={() => decision("approve")}
                      >
                        <Check size={15} />
                        {active.review.analysis.planDraft
                          ? "Approve to templates"
                          : "Approve change"}
                      </button>
                      <button
                        disabled={busy}
                        className="secondary-action"
                        onClick={() => decision("decline")}
                      >
                        <X size={15} />
                        Keep original
                      </button>
                    </div>
                  ) : (
                    <p className="small-note">
                      {active.review.approval.replaceAll("_", " ")}
                    </p>
                  )}
                </div>
              )}
              {active.review && (
                <button
                  disabled={busy}
                  className="text-action"
                  onClick={async () => {
                    try {
                      await api.post(
                        `/performance/reviews/${active.review._id}/retry`,
                      );
                      toast.success("Fresh review queued");
                      refetch();
                    } catch {
                      toast.error("A review may already be running");
                    }
                  }}
                >
                  Request fresh review
                </button>
              )}
              <Link
                className="text-action"
                to={`/coach/athletes/${active.athlete._id}`}
              >
                Open training calendar and insights <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <p className="panel-body">
              Select an athlete to review their training.
            </p>
          )}
        </aside>
      </div>
      <section className="work-panel coach-calendar" aria-label="Training calendar">
        <div className="section-heading coach-calendar-head">
          <div>
            <h2>Training calendar</h2>
            <p>Sessions for an athlete assigned to you.</p>
          </div>
          <label>
            Athlete
            <select
              className="fp-input"
              value={active?.athlete._id || ""}
              onChange={(event) => {
                setSelected(event.target.value);
                setFilter("all");
                setSearch("");
              }}
              disabled={!all.length}
            >
              {!all.length && <option value="">No assigned athletes</option>}
              {all.map((row: any) => (
                <option key={row.athlete._id} value={row.athlete._id}>
                  {row.athlete.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {active ? (
          <MonthCalendar athleteId={active.athlete._id} showDayPanel />
        ) : (
          <p className="panel-body">
            Invite an athlete to see their training calendar.
          </p>
        )}
      </section>
      {(roster?.invited?.length ?? 0) > 0 && (
        <p className="small-note mt-6">
          {roster?.invited?.length ?? 0} pending athlete invitations. Athletes
          accept in their account settings.
        </p>
      )}
    </motion.div>
  );
}
