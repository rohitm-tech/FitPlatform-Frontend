import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from './LoadingSpinner';
import type { Role } from '../../types/domain';

// A user without any of the allowed roles never reaches a doomed API
// request: this guard checks req.user's roles client-side before rendering
// any area at all, mirroring the backend's requireRole(...) gate. Hiding the
// UI is a UX nicety here, not the security boundary — that's enforced again
// on every request by requireRole on the server.
export const RoleRoute = ({ roles }: { roles: Role[] }) => {
  const { isAuthenticated, isReady, hasRole } = useAuth();

  if (!isReady) return <PageLoader />;

  if (!isAuthenticated || !roles.some((role) => hasRole(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
