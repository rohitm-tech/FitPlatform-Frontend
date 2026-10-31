import { useParams } from 'react-router-dom';

// Full pairing/QR/PIN kiosk flow is built in Phase 5. This stub confirms the
// route and gymId param resolve correctly end to end.
export default function KioskHome() {
  const { gymId } = useParams();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-black text-white">
      <p className="text-3xl font-display">FitPlatform Kiosk</p>
      <p className="text-sm text-white/60">Gym: {gymId}</p>
    </div>
  );
}
