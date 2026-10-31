import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { RoleSwitcher } from './RoleSwitcher';

export const Navbar = () => {
  const { isAuthenticated, user, activeRole } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: 'var(--fp-border)' }}
    >
      <Link to={isAuthenticated ? `/${activeRole ?? 'athlete'}` : '/'} className="font-display text-lg font-semibold">
        FitPlatform
      </Link>
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <RoleSwitcher />
            <span className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
              {user?.name}
            </span>
            <button
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: 'var(--fp-border)' }}
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/sign-in" className="text-sm">
              Sign in
            </Link>
            <Link
              to="/auth/sign-up"
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: 'var(--fp-border)' }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
