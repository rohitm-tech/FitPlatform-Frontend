import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { MessageThread } from "../common/MessageThread";

type Quote = {
  plan: string;
  planName: string;
  included: number | null;
  used: number;
  remaining: number | null;
  unlocked: boolean;
  needsPayment: boolean;
  amountMinor: number;
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export function CoachChatOffer({ coachId, coachName }: { coachId: string; coachName: string }) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const queries = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const quote = useQuery({
    queryKey: ["coach-chat-quote", coachId],
    queryFn: async () => (await api.get(`/billing/coach-chat/${coachId}`)).data.data as Quote,
    enabled: isAuthenticated && hasRole("athlete"),
  });

  if (!isAuthenticated) {
    return (
      <aside className="coach-chat-offer">
        <p>Sign in as an athlete to chat with {coachName}.</p>
        <Link className="primary-action" to="/auth/sign-in">
          Sign in
        </Link>
      </aside>
    );
  }
  if (!hasRole("athlete") || !quote.data) return null;
  const data = quote.data;

  const unlock = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/billing/coach-chat", { coachId });
      await queries.invalidateQueries({ queryKey: ["coach-chat-quote", coachId] });
    } catch (err: any) {
      setError(err.response?.data?.message || "The chat could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  if (data.unlocked && user) {
    return (
      <section className="coach-chat-offer" aria-label={`Chat with ${coachName}`}>
        <h2>Chat with {coachName}</h2>
        <MessageThread
          endpoint={`/my-coach/chats/${coachId}/messages`}
          selfId={user._id}
          otherName={coachName}
          placeholder={`Message ${coachName}`}
        />
      </section>
    );
  }

  const price = rupees(data.amountMinor);
  const copy = data.needsPayment
    ? data.included
      ? `Premium includes ${data.included} coach chats. Pay ${price} for one more chat with ${coachName}.`
      : `Pay ${price} to chat with ${coachName}.`
    : `Premium includes ${data.included} coach chats. ${data.remaining} left, so chatting with ${coachName} is included.`;

  return (
    <aside className="coach-chat-offer">
      <p>{copy}</p>
      {error && (
        <p className="form-feedback" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="primary-action" disabled={busy} onClick={unlock}>
        {busy ? "Opening…" : data.needsPayment ? `Pay ${price}` : `Chat with ${coachName}`}
      </button>
      {data.needsPayment && (
        <p className="coach-chat-note">This records the fee. It is not a live card charge yet.</p>
      )}
    </aside>
  );
}
