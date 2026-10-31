import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useComments, useCreateComment } from "../../queries/useAthlete";
export function CommentsThread({
  athleteId,
  workoutId,
  workoutLogId,
}: {
  athleteId: string;
  workoutId?: string;
  workoutLogId?: string;
}) {
  const { user } = useAuth();
  const query = useComments(athleteId, { workoutId, workoutLogId });
  const create = useCreateComment(athleteId);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || create.isPending) return;
    setError("");
    try {
      await create.mutateAsync({ workoutId, workoutLogId, text: text.trim() });
      setText("");
    } catch {
      setError("Your note could not be saved. Please try again.");
    }
  };
  const coachNotes = [...(query.data || [])]
    .filter((comment) => comment.authorId?.roles?.includes("coach"))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const latestCoachNote = coachNotes[0];
  return (
    <>
      {latestCoachNote && (
        <div className="coach-note-callout">
          <p>{latestCoachNote.text}</p>
          <p className="coach-note-by">
            {latestCoachNote.authorId?.name || "Coach"}, coach
            {coachNotes.length > 1 ? ` · ${coachNotes.length} notes` : ""}
            {" · "}
            <time dateTime={latestCoachNote.createdAt}>
              {new Date(latestCoachNote.createdAt).toLocaleDateString()}
            </time>
          </p>
        </div>
      )}
      <details className="coach-notes">
      <summary>
        Coach & athlete notes
        {query.data?.length ? ` (${query.data.length})` : ""}
      </summary>
      {query.isLoading ? (
        <p className="section-note" role="status">
          Loading notes…
        </p>
      ) : query.isError ? (
        <p className="field-error">
          Notes couldn’t be loaded.{" "}
          <button onClick={() => query.refetch()}>Retry</button>
        </p>
      ) : (
        <ul>
          {query.data?.map((comment) => (
            <li key={comment._id}>
              <strong>{comment.authorId?.name || "Former member"}</strong>
              <time>{new Date(comment.createdAt).toLocaleDateString()}</time>
              <p>{comment.text}</p>
            </li>
          ))}
          {!query.data?.length && (
            <li className="section-note">
              No notes yet. Add context for your coach or athlete.
            </li>
          )}
        </ul>
      )}
      {user && (
        <form onSubmit={submit}>
          <label
            className="sr-only"
            htmlFor={`note-${workoutId || workoutLogId}`}
          >
            Add a session note
          </label>
          <input
            id={`note-${workoutId || workoutLogId}`}
            className="fp-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a session note…"
            required
            maxLength={2000}
          />
          <button
            className="secondary-action"
            disabled={create.isPending || !text.trim()}
            type="submit"
          >
            {create.isPending ? "Saving…" : "Send"}
          </button>
        </form>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </details>
    </>
  );
}
