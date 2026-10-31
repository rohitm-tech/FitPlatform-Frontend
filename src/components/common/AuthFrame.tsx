import { useState } from "react";
import type { ReactNode } from "react";
import {
  Moon,
  Dumbbell,
  ShieldCheck,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../../auth.css";
export function AuthFrame({
  children,
  signup = false,
}: {
  children: ReactNode;
  signup?: boolean;
}) {
  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-story">
          <div>
            <h2>
              {signup ? (
                <>
                  Make room
                  <br />
                  for a stronger
                  <br />
                  <span>you.</span>
                </>
              ) : (
                <>
                  A little more
                  <br />
                  clarity.
                  <br />
                  <span>Every day.</span>
                </>
              )}
            </h2>
            <p>
              Your training, recovery and coach.
              <br />
              Connected in one place.
            </p>
          </div>
          <div className="auth-story-flow">
            {[
              [Moon, "Start with your signals", "Understand your recovery."],
              [Dumbbell, "Find your rhythm", "Follow a plan that has context."],
              [
                ShieldCheck,
                "Keep your coach close",
                "Human judgment, backed by evidence.",
              ],
            ].map(([Icon, title, copy]: any) => (
              <div key={title}>
                <span>
                  <Icon size={19} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="auth-story-bottom">
            <span>Built around your training day.</span>
            <Link
              to="/#workflow"
              aria-label="See how FitPlatform connects your training"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </aside>
        <section className="auth-form-side">{children}</section>
      </div>
      <p className="auth-bottom-note">
        Your account. Your training. Control what you share.
      </p>
    </div>
  );
}
export function PasswordField({
  id,
  value,
  onChange,
  minLength = 1,
  newPassword = false,
  describedBy,
  invalid = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  newPassword?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password">
      <input
        id={id}
        name="password"
        className="auth-input"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        autoComplete={newPassword ? "new-password" : "current-password"}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
