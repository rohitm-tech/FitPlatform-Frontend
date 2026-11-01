import GymInviteForm from "../../components/common/GymInviteForm";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
type Dashboard = {
  gym: { _id: string; name: string; logoUrl?: string };
  members: number;
  coaches: number;
  today: number;
  newMembers: number;
  coachActivity: number;
  week: { _id: string; count: number }[];
  atRisk: {
    _id: string;
    name: string;
    email: string;
    lastCheckIn?: { timestamp: string };
  }[];
};
export default function GymHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [pairing, setPairing] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [installMinor, setInstallMinor] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogo] = useState("");
  const load = async () => {
    setError("");
    try {
      const [d, p, k, c, prices] = await Promise.all([
        api.get("/gym/dashboard"),
        api.get("/gym/people"),
        api.get("/gym/devices"),
        api.get("/gym/people?role=coach"),
        api.get("/billing/pricing"),
      ]);
      setInstallMinor(prices.data.data.gymMonthlyMinor);
      setData(d.data.data);
      setName(d.data.data.gym.name);
      setLogo(d.data.data.gym.logoUrl || "");
      setPeople([
        ...new Map(
          [...p.data.data, ...c.data.data].map((person) => [
            person._id,
            person,
          ]),
        ).values(),
      ]);
      setDevices(k.data.data);
    } catch {
      setError(
        "The gym workspace could not be loaded. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const addDevice = async () => {
    setBusy("device");
    try {
      const r = await api.post("/gym/devices", { name: "Front desk kiosk" });
      setPairing(r.data.data);
      load();
    } catch {
      toast.error("Could not register device");
    } finally {
      setBusy("");
    }
  };
  const brand = async () => {
    setBusy("brand");
    setError("");
    try {
      await api.patch("/gym/branding", { name, logoUrl });
      toast.success("Gym branding saved");
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || "Branding could not be saved.");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="product-page gym-page">
      <header className="page-greeting gym-page-heading">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {data?.gym.name || "Gym dashboard"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Installation{" "}
            {installMinor != null
              ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(installMinor / 100)
              : "fee"}{" "}
            is billed every month.
          </p>
        </div>
        <div className="flex gap-2">
          {["Overview", "Members", "Coaches", "Kiosk", "Branding"].map((x) => (
            <button
              key={x}
              aria-pressed={tab === x}
              onClick={() => setTab(x)}
              className={`rounded-full border px-3 py-2 text-sm ${tab === x ? "bg-emerald-600 text-white" : ""}`}
            >
              {x}
            </button>
          ))}
        </div>
      </header>
      {error && (
        <div className="form-feedback" role="alert">
          {error}
          <button className="row-action" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {loading && (
        <p className="page-state" role="status">
          Loading gym workspace…
        </p>
      )}
      {!loading && data && tab === "Overview" && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active members", data?.members],
              ["Check-ins today", data?.today],
              ["New this month", data?.newMembers],
              ["Coach activity (7d)", data?.coachActivity],
            ].map(([l, v]) => (
              <div key={String(l)} className="fp-surface rounded-xl p-5">
                <p className="text-sm text-slate-500">{l}</p>
                <p className="mt-2 text-3xl font-semibold">{v ?? "—"}</p>
              </div>
            ))}
          </div>
          <section className="mt-5 fp-surface rounded-xl p-5">
            <h2 className="font-semibold">Check-ins this week</h2>
            {!data?.week.length && (
              <p className="empty-copy">No check-ins recorded this week.</p>
            )}
            <div className="mt-4 flex h-36 items-end gap-3">
              {(data?.week || []).map((x) => (
                <div
                  key={x._id}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs">{x.count}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(x.count / Math.max(1, ...(data?.week || []).map((day) => day.count))) * 95}px`,
                      background: "var(--fp-chart)",
                    }}
                  />
                  <span className="text-[10px] text-slate-500">
                    {x._id.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-5 fp-surface rounded-xl p-5">
            <h2 className="font-semibold">Members at risk</h2>
            {data?.atRisk.length ? (
              data.atRisk.map((p) => (
                <p key={p._id} className="mt-2 text-sm">
                  {p.name} ·{" "}
                  {p.lastCheckIn
                    ? `Last visit ${new Date(p.lastCheckIn.timestamp).toLocaleDateString()}`
                    : "No check-ins yet"}
                </p>
              ))
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Everyone has checked in during the last 7 days.
              </p>
            )}
          </section>
        </>
      )}
      {(tab === "Members" || tab === "Coaches") && <GymInviteForm />}
      {tab === "Members" && (
        <People rows={people.filter((p) => p.roles.includes("athlete"))} />
      )}
      {tab === "Coaches" && (
        <People rows={people.filter((p) => p.roles.includes("coach"))} />
      )}
      {tab === "Kiosk" && (
        <section className="mt-6 fp-surface rounded-xl p-5">
          <div className="flex justify-between">
            <div>
              <h2 className="font-semibold">Kiosk devices</h2>
              <p className="text-sm text-slate-500">
                Pair a portrait display using a one-time code.
              </p>
            </div>
            <button
              disabled={busy === "device"}
              onClick={addDevice}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
            >
              Register device
            </button>
          </div>
          {pairing && (
            <p className="my-4 rounded-lg bg-amber-100 p-4 text-center">
              Pair at <b>/kiosk/{data?.gym._id}</b> with code{" "}
              <b className="text-xl">{pairing.pairingCode}</b> · expires in 10
              minutes
            </p>
          )}
          {!devices.length && (
            <p className="empty-copy">
              No kiosks yet. Register a device to create a pairing code.
            </p>
          )}
          {devices.map((d) => (
            <div
              key={d.deviceId}
              className="mt-3 flex justify-between border-t py-3"
            >
              {d.name}{" "}
              <button
                disabled={busy === d.deviceId}
                onClick={async () => {
                  setBusy(d.deviceId);
                  try {
                    await api.delete(`/gym/devices/${d.deviceId}`);
                    toast.success("Device revoked");
                    await load();
                  } catch {
                    toast.error("Device could not be revoked");
                  } finally {
                    setBusy("");
                  }
                }}
                className="text-red-600"
              >
                Revoke
              </button>
            </div>
          ))}
        </section>
      )}
      {tab === "Branding" && (
        <section className="mt-6 max-w-xl fp-surface rounded-xl p-5">
          <h2 className="font-semibold">Kiosk branding</h2>
          <label className="fp-label mt-4" htmlFor="gym-name">
            Gym name
          </label>
          <input
            className="fp-input"
            id="gym-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="fp-label mt-3" htmlFor="gym-logo">
            Logo URL
          </label>
          <input
            className="fp-input"
            id="gym-logo"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogo(e.target.value)}
          />
          <button
            disabled={busy === "brand" || !name.trim()}
            onClick={brand}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white"
          >
            Save branding
          </button>
        </section>
      )}
    </div>
  );
}
function People({ rows }: { rows: any[] }) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {!rows.length && (
        <p className="empty-copy">
          No people in this directory yet. Create an invitation link above.
        </p>
      )}
      {rows.map((p) => (
        <article key={p._id} className="fp-surface rounded-xl p-4">
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-slate-500">{p.email}</p>
          <p className="mt-3 text-xs">
            {p.checkIns} visits · Last:{" "}
            {p.lastCheckIn
              ? new Date(p.lastCheckIn).toLocaleDateString()
              : "Never"}
          </p>
        </article>
      ))}
    </div>
  );
}
