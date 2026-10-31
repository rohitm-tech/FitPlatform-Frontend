import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, roleHomePath } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { RoleSwitcher } from './RoleSwitcher';

export const Navbar = () => {
  const { isAuthenticated, user, activeRole } = useAuth();
  const pathname=useLocation().pathname;
  const isMarketing=pathname==='/';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  if(pathname.startsWith('/auth/'))return <header className="product-nav auth-nav"><Link to="/" className="product-brand">fitplatform<span>.</span></Link><div className="auth-nav-action"><span>{pathname==='/auth/sign-up'?'Already have an account?':'New to FitPlatform?'}</span><Link to={pathname==='/auth/sign-up'?'/auth/sign-in':'/auth/sign-up'}>{pathname==='/auth/sign-up'?'Sign in':'Create account'}</Link></div></header>;
  return (
    <header className="product-nav" style={{ borderColor: 'var(--fp-border)' }}>
      <Link
        to={
          isAuthenticated && !isMarketing
            ? roleHomePath(activeRole ?? 'athlete')
            : '/'
        }
        className="product-brand"
      >
        fitplatform<span>.</span>
      </Link>
      {isAuthenticated && !isMarketing && (
        <nav aria-label="Workspace" className="workspace-nav">
          {(activeRole === 'athlete'
            ? [
                ['/athlete', 'My day'],
                ['/athlete/recovery', 'Recovery'],
                ['/athlete/companion', 'AI coach'],
                ['/athlete/history', 'Training'],
                ['/athlete/insights', 'Progress'],
                ['/athlete/explorer', 'Muscle explorer'],
                ['/exercises', 'Exercises'],
              ]
            : activeRole === 'coach'
              ? [
                  ['/coach', 'Team overview'],
                  ['/coach/builder', 'Workout builder'],
                ]
              : activeRole === 'gym_owner'
                ? [['/gym', 'Gym operations']]
                : [['/admin', 'Access management']]
          ).map(([to, label]) => (
            <NavLink end key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      {(!isAuthenticated || isMarketing) && (
        <nav className="public-nav-links" aria-label="About FitPlatform">
          <a href="/#workflow">How it works</a>
          <a href="/#features">The platform</a>
        </nav>
      )}
      <div className="account-actions">
        {isAuthenticated ? (
          <>
            <RoleSwitcher />
            <Link to="/settings" className="text-sm">
              Settings
            </Link>
            <div className="account-name">
              <span className="account-avatar">
                {user?.name
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span>
                {user?.name}
                <small>{activeRole?.replace('_', ' ')} workspace</small>
              </span>
            </div>
            <button
              className="logout-control"
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
              className="logout-control"
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
