import { useEffect, useState } from "react";

import { api } from "../../services/api";

import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [pin, setPin] = useState("");
  const [sharing, setSharing] = useState(
    user?.profile?.shareDetailedLogs || false,
  );
  const [invites, setInvites] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get("/member-access/invitations")
      .then((r) => setInvites(r.data.data))
      .catch(() => toast.error("Could not load invitations"));
  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/users/onboarding", { shareDetailedLogs: sharing });
      if (pin) await api.post("/users/me/kiosk-pin", { pin });
      setPin("");
      toast.success("Preferences saved");
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    try {
      const r = await api.get("/users/me/export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(r.data.data, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "fitplatform-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not export data");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Your account</h1>
      <p className="mt-3 text-slate-400">
        Control your training privacy and gym check-in.
      </p>
      <form
        onSubmit={save}
        className="fp-surface mt-8 space-y-5 rounded-xl p-6"
      >
        <div>
          <h2 className="font-semibold">Training privacy</h2>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={sharing}
              onChange={(e) => setSharing(e.target.checked)}
            />
            Allow my coach to see detailed workout logs
          </label>
          <p className="mt-2 text-xs text-slate-400">
            Your coach can still assign plans and view summary statistics. Gym
            owners see attendance only.
          </p>
        </div>
        <div>
          <label htmlFor="pin" className="fp-label">
            Kiosk PIN
          </label>
          <input
            id="pin"
            className="fp-input max-w-xs"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="New 4-digit PIN"
          />
          <p className="mt-2 text-xs text-slate-400">
            Leave blank to keep your existing PIN.
          </p>
        </div>
        <button disabled={busy} className="rounded-lg px-4 py-2">
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
      <section className="mt-8">
        <h2 className="font-semibold">Coach invitations</h2>
        {invites.length ? (
          invites.map((i) => (
            <div
              key={i._id}
              className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b py-4"
            >
              <span>{i.coachId?.name} wants to coach you</span>
              <div className="flex gap-3">
                {[true, false].map((accept) => (
                  <button
                    key={String(accept)}
                    className="rounded-lg border px-4 py-2 text-sm"
                    onClick={async () => {
                      try {
                        await api.patch(`/member-access/invitations/${i._id}`, {
                          accept,
                        });
                        load();
                      } catch {
                        toast.error("Could not update invitation");
                      }
                    }}
                  >
                    {accept ? "Accept" : "Decline"}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="mt-3 text-sm text-slate-400">No pending invitations.</p>
        )}
      </section>
      <section className="mt-8 border-t pt-6">
        <h2 className="font-semibold">Your data</h2>
        <button
          onClick={exportData}
          className="mt-4 rounded-lg border px-4 py-2 text-sm"
        >
          Download my data
        </button>
        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold text-red-300">Delete account</h3>
          <p className="mt-2 text-sm text-slate-400">
            This permanently deletes your profile and personal training records.
            Gym owners must transfer ownership first. Type DELETE to continue.
          </p>
          <input
            aria-label="Type DELETE to confirm"
            className="fp-input mt-3 max-w-xs"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <button
            type="button"
            disabled={confirmation !== "DELETE" || busy}
            className="ml-3 mt-3 rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300"
            onClick={async () => {
              setBusy(true);
              try {
                await api.delete("/users/me");
                window.location.assign("/");
              } catch (e: any) {
                toast.error(
                  e.response?.data?.message || "Could not delete account",
                );
                setBusy(false);
              }
            }}
          >
            Delete my account
          </button>
        </div>
      </section>
    </div>
  );
}
