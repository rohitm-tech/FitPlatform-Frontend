import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp } from "lucide-react";
import { api } from "../../services/api";

type Message = {
  _id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

function stamp(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function MessageThread({
  endpoint,
  selfId,
  otherName,
  placeholder,
  autoFocus = false,
  onSeen,
}: {
  endpoint: string;
  selfId: string;
  otherName: string;
  placeholder: string;
  autoFocus?: boolean;
  onSeen?: () => void;
}) {
  const queries = useQueryClient();
  const inputId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [bill, setBill] = useState<{ code?: string; amountMinor?: number; coachId?: string } | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const seen = useRef(onSeen);
  seen.current = onSeen;
  const thread = useQuery({
    queryKey: ["messages", endpoint],
    queryFn: async () => (await api.get(endpoint)).data.data as Message[],
    refetchInterval: 20000,
  });
  const send = useMutation({
    mutationFn: async (body: string) => (await api.post(endpoint, { text: body })).data.data,
    onSuccess: () => {
      setText("");
      setBill(null);
      queries.invalidateQueries({ queryKey: ["messages", endpoint] });
      queries.invalidateQueries({ queryKey: ["my-coach"] });
    },
    onError: (e: any) => {
      const charge = e.response?.data?.errors?.[0];
      setBill(charge && typeof charge === "object" ? charge : null);
      setError(e.response?.data?.message || "Your message could not be sent. Try again.");
    },
  });
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [thread.data?.length]);
  useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: false });
  }, [autoFocus]);
  useEffect(() => {
    if (thread.isSuccess) seen.current?.();
  }, [thread.dataUpdatedAt, thread.isSuccess]);
  const payForCoach = async () => {
    if (!bill?.coachId) return;
    setError("");
    try {
      await api.post("/billing/coach-chat", { coachId: bill.coachId });
      setBill(null);
      const body = text.trim();
      if (body) send.mutate(body);
    } catch (err: any) {
      setError(err.response?.data?.message || "The conversation could not be unlocked.");
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    setError("");
    setBill(null);
    send.mutate(body);
  };
  const messages = thread.data || [];
  return (
    <div className="message-thread">
      {thread.isError ? (
        <p className="message-empty">
          Messages could not be loaded.{" "}
          <button type="button" onClick={() => thread.refetch()}>
            Try again
          </button>
        </p>
      ) : thread.isLoading ? (
        <p className="message-empty">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="message-empty">No messages yet. Say hello to {otherName}.</p>
      ) : (
        <ol className="message-list" ref={list} aria-label={`Messages with ${otherName}`}>
          {messages.map((message) => {
            const mine = String(message.senderId) === String(selfId);
            return (
              <li key={message._id} className={mine ? "is-mine" : "is-theirs"}>
                <span className="message-meta">
                  {mine ? "You" : otherName} · <time dateTime={message.createdAt}>{stamp(message.createdAt)}</time>
                </span>
                <p>{message.text}</p>
              </li>
            );
          })}
        </ol>
      )}
      <form className="message-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={inputId}>
          Message {otherName}
        </label>
        <textarea
          id={inputId}
          ref={input}
          rows={1}
          value={text}
          maxLength={2000}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event as unknown as FormEvent);
            }
          }}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        <button
          type="submit"
          className="message-send"
          disabled={!text.trim() || send.isPending}
          aria-label={send.isPending ? "Sending" : `Send to ${otherName}`}
        >
          <ArrowUp size={16} />
        </button>
      </form>
      {error && (
        <p id={`${inputId}-error`} className="message-error" role="alert">
          {error}
          {bill?.code === "coach_chat_payment" && bill.coachId && (
            <>
              {" "}
              <button type="button" className="text-action" onClick={payForCoach}>
                Pay{" "}
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format((bill.amountMinor || 0) / 100)}
              </button>
            </>
          )}
          {bill?.code === "upgrade" && (
            <>
              {" "}
              <a className="text-action" href="/settings?section=plan">
                View plans
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
