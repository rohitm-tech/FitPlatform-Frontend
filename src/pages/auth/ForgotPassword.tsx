import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Forgot your password?</h1>
      <p className="mt-3 text-sm text-slate-400">
        Password email delivery is not connected in this prototype. Contact your
        platform admin for account help.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.post("/auth/forgot-password", { email });
          setDone(true);
        }}
      >
        <label htmlFor="reset-email" className="fp-label">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          required
          className="fp-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="rounded-lg px-4 py-2">Request account help</button>
        {done && (
          <p role="status" className="text-sm">
            Request acknowledged. No email is sent in this demo.
          </p>
        )}
      </form>
      <Link to="/auth/sign-in" className="mt-6 block text-sm underline">
        Back to sign in
      </Link>
    </div>
  );
}
