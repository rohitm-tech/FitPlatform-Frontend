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
  const [name, setName] = useState("");
  const [logoUrl, setLogo] = useState("");
  const load = async () => {
    try {
      const [d, p, k, c] = await Promise.all([
        api.get("/gym/dashboard"),
        api.get("/gym/people"),
        api.get("/gym/devices"),
        api.get("/gym/people?role=coach"),
      ]);
      setData(d.data.data);
      setName(d.data.data.gym.name);
      setLogo(d.data.data.gym.logoUrl || "");
      setPeople([...p.data.data, ...c.data.data]);
      setDevices(k.data.data);
    } catch {
      toast.error("Could not load gym dashboard");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const addDevice = async () => {
    try {
      const r = await api.post("/gym/devices", { name: "Front desk kiosk" });
      setPairing(r.data.data);
      load();
    } catch {
      toast.error("Could not register device");
    }
  };
  const brand = async () => {
    await api.patch("/gym/branding", { name, logoUrl });
    toast.success("Gym branding saved");
    load();
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {data?.gym.name || "Gym dashboard"}
          </h1>
        </div>
        <div className="flex gap-2">
          {["Overview", "Members", "Coaches", "Kiosk", "Branding"].map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`rounded-full border px-3 py-2 text-sm ${tab === x ? "bg-emerald-600 text-white" : ""}`}
            >
              {x}
            </button>
          ))}
        </div>
      </header>
      {tab === "Overview" && (
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
            <div className="mt-4 flex h-36 items-end gap-3">
              {(data?.week || []).map((x) => (
                <div
                  key={x._id}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs">{x.count}</span>
                  <div
                    className="w-full rounded-t bg-emerald-500"
                    style={{ height: `${Math.max(8, x.count * 14)}px` }}
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
          {devices.map((d) => (
            <div
              key={d.deviceId}
              className="mt-3 flex justify-between border-t py-3"
            >
              {d.name}{" "}
              <button
                onClick={async () => {
                  await api.delete(`/gym/devices/${d.deviceId}`);
                  toast.success("Device revoked");
                  load();
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
          <label className="fp-label mt-4">Gym name</label>
          <input
            className="fp-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="fp-label mt-3">Logo URL</label>
          <input
            className="fp-input"
            value={logoUrl}
            onChange={(e) => setLogo(e.target.value)}
          />
          <button
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
