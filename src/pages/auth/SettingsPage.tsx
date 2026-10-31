import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ShieldCheck, Check } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch } from "../../store/hooks";
import { bootstrapAuth } from "../../store/slices/authSlice";
import PlanPanel from "./PlanPanel";
export default function SettingsPage() {
  const { user } = useAuth();
  const athlete = user?.roles.includes("athlete");
  const dispatch = useAppDispatch();
  const queries = useQueryClient();
  const [params, setParams] = useSearchParams();
  const section = params.get("section") || "account";
  const [sharing, setSharing] = useState(
    user?.profile?.shareDetailedLogs || false,
  );
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [exporting, setExporting] = useState("");
  const [inviteBusy, setInviteBusy] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const invites = useQuery({
    queryKey: ["account-invites", user?._id],
    queryFn: async () =>
      (await api.get("/member-access/invitations")).data.data,
    enabled: !!athlete,
  });
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      await api.post("/users/onboarding", { shareDetailedLogs: sharing });
      if (pin) await api.post("/users/me/kiosk-pin", { pin });
      setPin("");
      await dispatch(bootstrapAuth());
      queries.invalidateQueries({ queryKey: ["performance"] });
      setSaved(true);
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "Preferences could not be saved. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const download = async (format: "json" | "xlsx") => {
    setExporting(format);
    setError("");
    try {
      const result = await api.get(
        format === "xlsx" ? "/users/me/export.xlsx" : "/users/me/export",
        format === "xlsx" ? { responseType: "blob" } : undefined,
      );
      const blob =
        format === "xlsx"
          ? result.data
          : new Blob([JSON.stringify(result.data.data, null, 2)], {
              type: "application/json",
            });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rhythm-data.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Your export could not be downloaded. Try again.");
    } finally {
      setExporting("");
    }
  };
  const invitation = async (id: string, accept: boolean) => {
    setInviteBusy(id);
    setError("");
    try {
      await api.patch(`/member-access/invitations/${id}`, { accept });
      await invites.refetch();
      queries.invalidateQueries({ queryKey: ["coach-athletes"] });
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "Invitation could not be updated. Try again.",
      );
    } finally {
      setInviteBusy("");
    }
  };
  const tabs = [
    ["account", "Account"],
    ...(athlete
      ? [
          ["privacy", "Training & privacy"],
          ["plan", "Plan"],
          [
            "invitations",
            `Invitations${invites.data?.length ? ` (${invites.data.length})` : ""}`,
          ],
        ]
      : []),
    ["data", "Your data"],
  ];
  return (
    <div className="product-page settings-page">
      <nav className="settings-tabs" aria-label="Account settings">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            aria-current={section === id ? "page" : undefined}
            onClick={() => {
              setParams({ section: id });
              setError("");
              setSaved(false);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <div
          className="form-feedback"
          ref={errorRef}
          tabIndex={-1}
          role="alert"
        >
          {error}
        </div>
      )}
      {section === "plan" && athlete && <PlanPanel />}
      {section === "account" && (
        <section className="settings-row">
          <div>
            <h2>Appearance</h2>
            <p className="settings-description">
              White workspace, or a black field with white type.
            </p>
          </div>
          <div className="settings-panel">
            <div className="theme-choice">
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
              >
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
            </div>
          </div>
        </section>
      )}
      {section === "account" && (
        <section className="settings-row">
          <div>
            <h2>Profile</h2>
            <p className="settings-description">
              Your identity and approved workspaces.
            </p>
          </div>
          <div className="settings-panel">
            <dl className="account-details">
              <div>
                <dt>Name</dt>
                <dd>{user?.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Account access</dt>
                <dd>
                  {user?.roles
                    .map((role) => role.replace("_", " "))
                    .join(" · ")}
                </dd>
              </div>
            </dl>
            {athlete && (
              <Link className="secondary-action mt-5" to="/onboarding">
                Update training profile
              </Link>
            )}
            <p className="section-note">
              Staff access is managed by your platform admin.
            </p>
          </div>
        </section>
      )}
      {section === "privacy" && athlete && (
        <section className="settings-row">
          <div>
            <h2>Training privacy & check-in</h2>
            <p className="settings-description">
              Choose what your coach can see and set up a PIN for gym kiosks.
            </p>
            <p className="settings-description">
              Your coach can assign workouts and see summary readiness. Detailed
              logs and recovery readings require your consent.
            </p>
          </div>
          <form className="settings-panel" onSubmit={save}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={sharing}
                onChange={(e) => {
                  setSharing(e.target.checked);
                  setSaved(false);
                }}
              />
              <span className="text-sm font-medium">
                Share detailed workout and recovery records with my coach
              </span>
            </label>
            <p className="section-note">
              Gym owners receive attendance and aggregate statistics.
            </p>
            <label htmlFor="kiosk-pin" className="fp-label mt-6">
              New kiosk PIN <span className="font-normal">(optional)</span>
            </label>
            <input
              id="kiosk-pin"
              className="fp-input"
              type="password"
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setSaved(false);
              }}
              placeholder="4 digits"
            />
            <p className="section-note">
              Leave blank to keep your current PIN. Five failed check-in
              attempts temporarily lock the PIN.
            </p>
            <button className="primary-action" disabled={busy} type="submit">
              {busy ? "Saving preferences…" : "Save preferences"}
            </button>
            {saved && (
              <p className="assignment-success" role="status">
                <Check size={17} />
                Preferences saved.
              </p>
            )}
          </form>
        </section>
      )}
      {section === "invitations" && athlete && (
        <section className="settings-row">
          <div>
            <h2>Coach invitations</h2>
            <p className="settings-description">
              Accept an invitation to let a coach assign workouts and review
              your training.
            </p>
            <p className="settings-description">
              You control detailed record sharing under Training & privacy.
            </p>
          </div>
          <div className="settings-panel">
            {invites.isLoading ? (
              <p role="status">Loading invitations…</p>
            ) : invites.isError ? (
              <div className="page-state">
                <p>Invitations couldn’t be loaded.</p>
                <button onClick={() => invites.refetch()}>Retry</button>
              </div>
            ) : invites.data?.length ? (
              <ul className="data-list">
                {invites.data.map((invite: any) => (
                  <li key={invite._id}>
                    <div className="section-row">
                      <div>
                        <strong>{invite.coachId?.name || "A coach"}</strong>
                        <p>{invite.offer || "Wants to coach you"}</p>
                      </div>
                      <div className="flex gap-2">
                        {[true, false].map((accept) => (
                          <button
                            key={String(accept)}
                            className="secondary-action"
                            disabled={inviteBusy === invite._id}
                            onClick={() => invitation(invite._id, accept)}
                          >
                            {inviteBusy === invite._id
                              ? "Updating…"
                              : accept
                                ? "Accept"
                                : "Decline"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="chat-state">
                <ShieldCheck size={24} />
                <h3>You’re all caught up.</h3>
                <p>No pending coach invitations.</p>
              </div>
            )}
          </div>
        </section>
      )}
      {section === "data" && (
        <>
          <section className="settings-row">
            <div>
              <h2>Download your records</h2>
              <p className="settings-description">
                Download a structured Excel workbook or the complete JSON
                archive, including saved photo content.
              </p>
            </div>
            <div className="settings-panel">
              <div className="header-actions">
                <button
                  className="primary-action"
                  disabled={!!exporting}
                  onClick={() => download("xlsx")}
                >
                  <Download size={17} />
                  {exporting === "xlsx"
                    ? "Preparing Excel…"
                    : "Download Excel (.xlsx)"}
                </button>
                <button
                  className="secondary-action"
                  disabled={!!exporting}
                  onClick={() => download("json")}
                >
                  <Download size={17} />
                  {exporting === "json" ? "Preparing JSON…" : "Download JSON"}
                </button>
              </div>
              <p className="section-note">
                Excel includes separate sheets with numeric training data,
                recovery, conversations and account activity. Photos are listed
                as metadata; the JSON archive contains their content.
              </p>
              <p className="section-note">
                The file contains personal records. Store it somewhere private.
              </p>
            </div>
          </section>
          <section className="settings-row">
            <div>
              <h2 className="text-red-400">Delete account</h2>
              <p className="settings-description">
                Permanently removes your profile, personal training records and
                conversations. This action cannot be undone.
              </p>
              <p className="settings-description">
                Gym owners must transfer ownership first. Accounts with
                completed payments need support-assisted closure so transaction
                records can be handled correctly.
              </p>
            </div>
            <div className="settings-panel">
              <label className="fp-label" htmlFor="delete-account-confirm">
                Type DELETE to confirm
              </label>
              <input
                id="delete-account-confirm"
                className="fp-input"
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              <button
                type="button"
                disabled={confirmation !== "DELETE" || busy}
                className="delete-account-button"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await api.delete("/users/me");
                    queries.clear();
                    window.location.assign("/");
                  } catch (e: any) {
                    setError(
                      e.response?.data?.message ||
                        "Account could not be deleted.",
                    );
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Deleting…" : "Permanently delete account"}
              </button>
            </div>
          </section>
        </>
      )}
      {!tabs.some(([id]) => id === section) && (
        <div className="page-state mt-6">
          <p>This settings section isn’t available for your account.</p>
          <button onClick={() => setParams({ section: "account" })}>
            Go to account settings
          </button>
        </div>
      )}
    </div>
  );
}
