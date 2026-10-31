import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from './LoadingSpinner';

export const ProtectedRoute = () => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
