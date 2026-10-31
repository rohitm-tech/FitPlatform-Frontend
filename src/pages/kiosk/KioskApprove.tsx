import { Link } from "react-router-dom";
import { useAuth, roleHomePath } from "../../hooks/useAuth";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";

export default function KioskApprove() {
  const { activeRole } = useAuth();
  const { requestId } = useParams();
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const approve = async () => {
    setBusy(true);
    try {
      await api.post(`/kiosk-qr/approve/${requestId}`, {
        token: params.get("token"),
      });
      setDone(true);
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not approve check-in");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="product-page invitation-page">
      <h1 className="text-3xl font-semibold">
        {done ? "You’re checked in" : "Approve gym check-in"}
      </h1>
      <p className="mt-4 text-slate-400">
        {done
          ? "Continue on the gym kiosk. It will sign you out automatically."
          : "Approve only if you just scanned the QR code on your gym’s kiosk. Your name and today’s workout will appear on that display for 90 seconds."}
      </p>
      {!params.get("token") && (
        <p className="form-feedback" role="alert">
          Scan a fresh QR code on your gym kiosk to approve a check-in.
        </p>
      )}
      {!done && (
        <button
          disabled={busy || !params.get("token")}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-3"
          onClick={approve}
        >
          {busy ? "Approving…" : "Approve check-in"}
        </button>
      )}
      <Link
        className="page-back mt-6"
        to={roleHomePath(activeRole || "athlete")}
      >
        Return to your workspace
      </Link>
      {error && (
        <p className="mt-4 text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
