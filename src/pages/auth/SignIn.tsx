import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../store/hooks';
import { loginUser } from '../../store/slices/authSlice';
import { roleHomePath } from '../../hooks/useAuth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await dispatch(loginUser({ email, password })).unwrap();
      const redirectTo = location.state?.from?.pathname || roleHomePath(user.roles[0]);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Sign in</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="fp-label" htmlFor="email">Email</label>
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
          <label className="fp-label" htmlFor="password">Password</label>
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
          style={{ borderColor: 'var(--fp-border)' }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        No account? <Link to="/auth/sign-up" className="underline">Sign up</Link>
      </p>
    </div>
  );
}
