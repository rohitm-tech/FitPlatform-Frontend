import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../store/hooks";
import { loginUser } from "../../store/slices/authSlice";
import { roleHomePath } from "../../hooks/useAuth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await dispatch(loginUser({ email, password })).unwrap();
      const redirectTo =
        (location.state?.from ? location.state.from.pathname + location.state.from.search + location.state.from.hash : roleHomePath(user.roles[0]));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Sign in</h1>
      <p className="text-sm" style={{ color: "var(--fp-text-muted)" }}>
        Your training, your team, your next step. Welcome back.
      </p>
      <section className="fp-surface rounded-xl p-4" aria-label="Demo accounts">
        <h2 className="text-sm font-semibold">Explore a demo workspace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Choose a role to fill its seeded credentials.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["Athlete", "athlete1@fitplatform.app", "Athlete1234!"],
            ["Coach", "coach1@fitplatform.app", "Coach1234!"],
            ["Gym owner", "owner@fitplatform.app", "Owner1234!"],
            ["Admin", "admin@fitplatform.app", "ChangeMe123!"],
          ].map(([role, mail, pass]) => (
            <button
              key={role}
              type="button"
              className="rounded-lg border px-3 py-2 text-left text-sm"
              onClick={() => {
                setEmail(mail);
                setPassword(pass);
              }}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Requires seeded data. Admin credentials may be overridden in the
          server environment.
        </p>
      </section>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="fp-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="fp-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="fp-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="fp-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: "var(--fp-border)" }}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/auth/forgot-password" className="text-sm underline">
          Forgot password?
        </Link>
      </form>
      <p className="text-sm" style={{ color: "var(--fp-text-muted)" }}>
        No account?{" "}
        <Link to="/auth/sign-up" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
