import { useState } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
export default function GymInviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("athlete");
  const [link, setLink] = useState("");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="fp-surface mt-6 rounded-xl p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await api.post("/gym-invitations", { email, role });
          setLink(r.data.data.url);
          setRecipient(email);
        } catch (e: any) {
          setError(
            e.response?.data?.message ||
              "Invitation could not be created. Try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-semibold">Invite to your gym</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          aria-label="Invited email"
          className="fp-input flex-1"
          type="email"
          required
          placeholder="member@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          aria-label="Invitation role"
          className="fp-input !w-auto"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="athlete">Member</option>
          <option value="coach">Approved coach</option>
        </select>
        <button disabled={busy} className="rounded-lg px-4 py-2">
          {busy ? "Creating…" : "Create invite link"}
        </button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {link && (
        <div className="mt-4">
          <p className="text-sm text-slate-400">
            Share this link with {recipient}. It expires in 7 days.
          </p>
          <button
            type="button"
            className="row-action"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Invitation link copied");
              } catch {
                toast.error("Select and copy the link below.");
              }
            }}
          >
            Copy invitation link
          </button>
          <input
            aria-label="Invitation link"
            readOnly
            className="fp-input mt-2"
            value={link}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </form>
  );
}
