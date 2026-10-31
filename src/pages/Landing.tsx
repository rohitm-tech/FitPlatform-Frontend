import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">
        Train. Coach. Run your gym.
      </h1>
      <p className="max-w-xl" style={{ color: 'var(--fp-text-muted)' }}>
        FitPlatform brings athletes, coaches, and gym owners together — with a 3D muscle
        explorer, AI-assisted plans, and a kiosk for the front desk.
      </p>
      <div className="flex gap-3">
        <Link to="/auth/sign-up" className="rounded-lg px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--fp-accent-rgb)' }}>
          Get started
        </Link>
        <Link
          to="/auth/sign-in"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
          style={{ borderColor: 'var(--fp-border)' }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
