import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Dumbbell,
  Users,
  Building2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { loginUser } from "../../store/slices/authSlice";
import { roleHomePath } from "../../hooks/useAuth";
import { AuthFrame, PasswordField } from "../../components/common/AuthFrame";
const accounts = [
  {
    role: "Athlete",
    email: "athlete1@fitplatform.app",
    password: "Athlete1234!",
    Icon: Dumbbell,
  },
  {
    role: "Coach",
    email: "coach1@fitplatform.app",
    password: "Coach1234!",
    Icon: Users,
  },
  {
    role: "Gym owner",
    email: "owner@fitplatform.app",
    password: "Owner1234!",
    Icon: Building2,
  },
  {
    role: "Admin",
    email: "admin@fitplatform.app",
    password: "ChangeMe123!",
    Icon: ShieldCheck,
  },
];
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await dispatch(
        loginUser({ email: email.trim(), password }),
      ).unwrap();
      const from = location.state?.from;
      const to = from
        ? from.pathname + (from.search || "") + (from.hash || "")
        : roleHomePath(user.roles[0]);
      navigate(to, { replace: true });
    } catch (e: any) {
      setError(
        e.status === 429 || e.message?.includes("429")
          ? "Too many sign-in attempts. Please wait before trying again."
          : e.code === "ERR_NETWORK"
            ? "We could not reach FitPlatform. Check your connection and try again."
            : "That email and password did not match. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame>
      <div className="auth-form-content">
        <div className="auth-heading">
          <h1>Welcome back.</h1>
          <p>Pick up where your training left off.</p>
        </div>
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          {error && (
            <div
              className="auth-error"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
            >
              <strong>Let’s try that again.</strong>
              <p id="signin-error">{error}</p>
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="signin-email">Email address</label>
            <input
              id="signin-email"
              name="email"
              className="auth-input"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelected("");
              }}
              placeholder="you@example.com"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "signin-error" : undefined}
            />
          </div>
          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="signin-password">Password</label>
              <Link to="/auth/forgot-password">Forgot password?</Link>
            </div>
            <PasswordField
              id="signin-password"
              value={password}
              onChange={setPassword}
              describedBy={error ? "signin-error" : undefined}
              invalid={!!error}
            />
          </div>
          <button className="auth-submit" disabled={busy} type="submit">
            {busy ? "Signing you in…" : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="auth-switch">
          New to FitPlatform? <Link to="/auth/sign-up">Create an account</Link>
        </p>
        <section className="auth-demo" aria-label="Demo accounts">
          <div className="auth-demo-heading">
            <h2>Take a look around.</h2>
            <span>Demo workspaces</span>
          </div>
          <div className="auth-demo-roles">
            {accounts.map(({ role, email, password, Icon }) => (
              <button
                type="button"
                className={selected === role ? "selected" : ""}
                key={role}
                aria-pressed={selected === role}
                onClick={() => {
                  setEmail(email);
                  setPassword(password);
                  setSelected(role);
                  setError("");
                }}
              >
                <Icon size={17} />
                <span>{role}</span>
                {selected === role && <Check size={14} />}
              </button>
            ))}
          </div>
          <p role="status">
            {selected
              ? `${selected} credentials filled. Select Sign in to continue.`
              : "Choose a role to fill its demo credentials."}
          </p>
          <small>
            Requires seeded accounts. Custom admin credentials may differ.
          </small>
        </section>
      </div>
    </AuthFrame>
  );
}
