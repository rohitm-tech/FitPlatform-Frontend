import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../store/hooks';
import { registerUser } from '../../store/slices/authSlice';
import type { Role } from '../../types/domain';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'athlete', label: 'I train (Athlete)' },
  { value: 'coach', label: 'I coach (Coach)' },
  { value: 'gym_owner', label: 'I own a gym (Gym Owner)' },
];

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<Role[]>(['athlete']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const toggleRole = (role: Role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (roles.length === 0) {
      toast.error('Pick at least one role');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await dispatch(registerUser({ name, email, password, roles })).unwrap();
      navigate(user.onboardingCompleted ? '/' : '/onboarding', { replace: true });
    } catch (error) {
      toast.error('Could not create account — the email may already be in use');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="fp-label" htmlFor="name">Name</label>
          <input id="name" required className="fp-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
            minLength={6}
            required
            className="fp-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <fieldset>
          <legend className="fp-label">I am a… (pick all that apply)</legend>
          <div className="flex flex-col gap-2">
            {ROLE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roles.includes(option.value)}
                  onChange={() => toggleRole(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--fp-border)' }}
        >
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        Already have an account? <Link to="/auth/sign-in" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
