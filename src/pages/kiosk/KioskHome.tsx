import {useAppDispatch} from '../../store/hooks';
import {setHeatData,clearSelectedMuscle} from '../../store/slices/explorerSlice';
import { Suspense, lazy, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
const BodyCanvas = lazy(() => import("../../3d/BodyExplorerCanvas"));
export default function KioskHome() {
  const { gymId = "" } = useParams();
  const dispatch=useAppDispatch();

  const credentials = () => ({
    headers: {
      Authorization: `Bearer ${JSON.parse(localStorage.getItem(`kiosk:${gymId}`) || "{}").deviceToken || ""}`,
    },
  });
  const [qrEpoch, setQrEpoch] = useState(0);
  const [qr, setQr] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [paired, setPaired] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const x = JSON.parse(localStorage.getItem(`kiosk:${gymId}`) || "null");
    if (x) {
      setGym(x.gym);
      setPaired(true);
    }
  }, [gymId]);
  useEffect(() => {
    if (!session) return;
    let active=true;
    const interval = setInterval(async () => {
      try {
        const r = await api.get(
          `/kiosk/session/${session.sessionId}`,
          credentials(),
        );
        if(active)setSession((s: any) => s?({ ...s, ...r.data.data }):null);
      } catch {
        if(active)setSession(null);
      }
    }, 12000);
    const end = setTimeout(() => setSession(null), Math.max(0,new Date(session.expiresAt).getTime()-Date.now()));
    return () => {
      active=false;
      clearInterval(interval);
      clearTimeout(end);
    };
  }, [session?.sessionId]);
  useEffect(() => {
    if (!paired || session) return;
    let stopped = false;
    let timer: ReturnType<typeof setInterval>;
    const d = JSON.parse(localStorage.getItem(`kiosk:${gymId}`) || "{}");
    const body = { gymId, deviceId: d.deviceId, deviceToken: d.deviceToken };
    api
      .post("/kiosk-qr/request", body)
      .then((r) => {
        if (stopped) return;
        const q = r.data.data;
        setQr(q);
        timer = setInterval(async () => {
          try {
            const result = await api.post(
              `/kiosk-qr/status/${q.requestId}`,
              body,
            );
            if(stopped)return;
            if (result.data.data) {
              setSession(result.data.data);
              setQr(null);
              clearInterval(timer);
            }
          } catch {
            if(stopped)return;
            setQr(null);
            clearInterval(timer);
            setQrEpoch((x) => x + 1);
          }
        }, 2500);
      })
      .catch(() => setQr(null));
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [paired, session?.sessionId, gymId, qrEpoch]);
  useEffect(()=>{
    const heat:Record<string,number>={};
    for(const item of session?.workout?.items||[])for(const muscle of item.exerciseId?.primaryMuscles||[])if(muscle.key)heat[muscle.key]=.65;
    dispatch(setHeatData(heat));
    return()=>{dispatch(setHeatData({}));dispatch(clearSelectedMuscle())};
  },[session?.workout,dispatch]);
  const pair = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post(`/kiosk/${gymId}/pair`, { code });
      const d = r.data.data;
      localStorage.setItem(`kiosk:${gymId}`, JSON.stringify(d));
      setGym(d.gym);
      setPaired(true);
    } catch {
      setError("Pairing code is invalid or expired");
    } finally {
      setBusy(false);
    }
  };
  const login = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = JSON.parse(localStorage.getItem(`kiosk:${gymId}`) || "{}");
      const r = await api.post(`/kiosk/${gymId}/login`, { ...d, email, pin });
      setSession(r.data.data);
      setEmail("");
      setPin("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not start session");
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    if (session?.sessionId)
      await api
        .delete(`/kiosk/session/${session.sessionId}`, credentials())
        .catch(() => {});
    setSession(null);
    setEmail("");
    setPin("");
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#101411] p-8 text-white">
      {gym?.logoUrl && (
        <img alt={`${gym.name} logo`} src={gym.logoUrl} className="mb-5 h-20 max-w-48 object-contain" />
      )}
      <p className="text-lg font-semibold text-emerald-300">
        {gym?.name || "FitPlatform"}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold">
        {session ? `Welcome, ${session.athlete?.name}` : "Check in to train"}
      </h1>
      {paired && (
        <div className="mt-6 h-64 w-full max-w-sm overflow-hidden rounded-xl">
          <Suspense fallback={<p>Loading muscle explorer…</p>}>
            <BodyCanvas autoRotate={!session} />
          </Suspense>
        </div>
      )}
      {session?.workout ? (
        <section className="mt-8 w-full max-w-xl rounded-2xl bg-white/10 p-6">
          <h2 className="mt-2 text-2xl">{session.workout.title}</h2>
          {session.workout.items.map((i: any) => (
            <p key={i._id} className="mt-3">
              {i.exerciseId?.name} · {i.sets} × {i.reps}
            </p>
          ))}
          <button
            onClick={logout}
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3"
          >
            Finish / log out
          </button>
        </section>
      ) : session ? (
        <section className="mt-8 text-center">
          <p>Check-in recorded. No workout planned for today.</p>
          <button
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3"
            onClick={logout}
          >
            Finish / log out
          </button>
        </section>
      ) : !paired ? (
        <form
          onSubmit={pair}
          className="mt-8 w-full max-w-sm rounded-2xl bg-white/10 p-6"
        >
          <h2>Pair this kiosk</h2>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Six-digit device pairing code" placeholder="6-digit pairing code"
            className="mt-4 w-full rounded-lg p-3 text-black"
          />
          <button
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-emerald-600 p-3"
          >
            {busy ? "Pairing…" : "Pair device"}
          </button>
        </form>
      ) : (
        !session && (
          <form
            onSubmit={login}
            className="mt-8 w-full max-w-sm rounded-2xl bg-white/10 p-6"
          >
            <h2>Member check-in</h2>
            {qr && (
              <div className="my-5 text-center">
                <img
                  src={qr.qr}
                  alt="Scan to approve check-in on your phone"
                  className="mx-auto h-44 w-44 rounded-lg"
                />
                <p className="mt-3 text-sm text-white/70">
                  Scan with your phone, or use your email and PIN below.
                </p>
              </div>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Member email" placeholder="Member email"
              className="mt-4 w-full rounded-lg p-3 text-black"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              aria-label="Four-digit member PIN" placeholder="4-digit PIN"
              className="mt-3 w-full rounded-lg p-3 text-black"
            />
            <button
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-emerald-600 p-3"
            >
              {busy ? "Checking…" : "Check in"}
            </button>
            <p className="mt-3 text-center text-sm text-white/60">
              Set your kiosk PIN in your profile settings.
            </p>
          </form>
        )
      )}
      {error && <p className="mt-4 text-red-300">{error}</p>}
    </div>
  );
}
