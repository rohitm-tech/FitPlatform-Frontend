import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { registerUser } from "../../store/slices/authSlice";
import { setActiveRole } from "../../store/slices/uiSlice";
import { roleHomePath } from "../../hooks/useAuth";
import { AuthFrame, PasswordField } from "../../components/common/AuthFrame";
import type { Role } from "../../types/domain";

const accountTypes: { id: Role; label: string; hint: string }[] = [
  { id: "athlete", label: "Athlete", hint: "Log training and work with a coach." },
  { id: "coach", label: "Coach", hint: "Invite athletes and assign sessions." },
  { id: "gym_owner", label: "Gym", hint: "Run your gym and its members." },
];

const joinRoles: Role[] = ["athlete", "coach", "gym_owner"];

export default function SignUp() {
  const [params] = useSearchParams();
  const requested = params.get("role");
  const [account, setAccount] = useState<Role>(
    joinRoles.includes(requested as Role) ? (requested as Role) : "athlete",
  );
  const [name, setName] = useState("");
  const [gymName, setGymName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setField("name");
      setError("Enter the name you would like to use.");
      return;
    }
    if (account === "gym_owner" && !gymName.trim()) {
      setField("gym");
      setError("Enter the gym name.");
      return;
    }
    setBusy(true);
    try {
      await dispatch(
        registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          roles: [account],
          gymName: account === "gym_owner" ? gymName.trim() : undefined,
        }),
      ).unwrap();
      dispatch(setActiveRole(account));
      navigate(account === "athlete" ? "/onboarding" : roleHomePath(account), {
        replace: true,
      });
    } catch (e: any) {
      const duplicate = e.status === 409 || e.message?.includes("409");
      setField(duplicate ? "email" : "");
      setError(
        duplicate
          ? "An account already uses this email. Sign in or use a different address."
          : "Your account could not be created. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame signup>
      <div className="auth-form-content">
        <div className="auth-heading">
          <h1>Create your account.</h1>
          <p>
            {account === "coach"
              ? "Coaches join free. Invite fees and the company share show on your dashboard."
              : params.get("intent") === "premium" && account === "athlete"
                ? "You start on Free. Subscribe to Premium from your dashboard after you sign up."
                : "Athletes and coaches start on Free."}
          </p>
        </div>
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          {error && (
            <div
              className="auth-error"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
            >
              <strong>One thing to check.</strong>
              <p id="signup-error">{error}</p>
              {field && <a href={`#signup-${field}`}>Go to {field}</a>}
            </div>
          )}
          <fieldset className="signup-roles">
            <legend>I am joining as</legend>
            {accountTypes.map(({ id, label, hint }) => (
              <label key={id} className={account === id ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="account"
                  value={id}
                  checked={account === id}
                  onChange={() => setAccount(id)}
                />
                <span>
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="auth-field">
            <label htmlFor="signup-name">Your name</label>
            <input
              id="signup-name"
              name="name"
              className="auth-input"
              autoComplete="name"
              maxLength={100}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              aria-invalid={field === "name" || undefined}
              aria-describedby={field === "name" ? "signup-error" : undefined}
            />
          </div>
          {account === "gym_owner" && (
            <div className="auth-field">
              <label htmlFor="signup-gym">Gym name</label>
              <input
                id="signup-gym"
                name="gym"
                className="auth-input"
                maxLength={100}
                required
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="The name members will see"
                aria-invalid={field === "gym" || undefined}
                aria-describedby={field === "gym" ? "signup-error" : undefined}
              />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              name="email"
              className="auth-input"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={field === "email" || undefined}
              aria-describedby={field === "email" ? "signup-error" : undefined}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Create a password</label>
            <PasswordField
              id="signup-password"
              value={password}
              onChange={setPassword}
              minLength={8}
              newPassword
              describedBy="password-guidance"
            />
            <p id="password-guidance" className="auth-field-hint">
              At least 8 characters. Make it something only you know.
            </p>
          </div>
          <button className="auth-submit" disabled={busy} type="submit">
            {busy ? "Creating your account…" : "Create account"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="auth-switch">
          Already part of the team? <Link to="/auth/sign-in">Sign in</Link>
        </p>
      </div>
    </AuthFrame>
  );
}
