import { useAuth, roleHomePath } from "../../hooks/useAuth";
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../services/api";
export default function JoinGym() {
  const { activeRole } = useAuth();
  const [params] = useSearchParams();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <div className="product-page invitation-page">
      <h1 className="text-3xl font-semibold">Join your gym</h1>
      <p className="mt-4 text-slate-400">
        Accept using the account matching your invited email address. Your gym
        will see attendance and summary statistics.
      </p>
      {!params.get("token") && (
        <p className="form-feedback" role="alert">
          Open the full invitation link your gym shared with you.
        </p>
      )}
      {!done && (
        <button
          disabled={busy || !params.get("token")}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-3"
          onClick={async () => {
            setBusy(true);
            try {
              await api.post("/gym-invitations/accept", {
                token: params.get("token"),
              });
              setDone(true);
              setMessage("You are now a member. Welcome to your gym.");
            } catch (e: any) {
              setMessage(
                e.response?.data?.message || "Could not accept invitation",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Joining…" : "Accept gym invitation"}
        </button>
      )}
      {message && (
        <p className="mt-4" role="status">
          {message}
        </p>
      )}
      <Link
        to={roleHomePath(activeRole || "athlete")}
        className="mt-6 block text-emerald-300"
      >
        Return to your workspace
      </Link>
    </div>
  );
}
