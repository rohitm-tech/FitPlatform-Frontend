import { useAppSelector } from '../store/hooks';
import type { Role } from '../types/domain';

const ROLE_PRIORITY: Role[] = ['athlete', 'coach', 'gym_owner', 'admin'];

export const roleHomePath = (role: Role) => {
  switch (role) {
    case 'coach':
      return '/coach';
    case 'gym_owner':
      return '/gym';
    case 'admin':
      return '/admin';
    default:
      return '/athlete';
  }
};

export const useAuth = () => {
  const { user, isAuthenticated, status } = useAppSelector((state) => state.auth);
  const { activeRole } = useAppSelector((state) => state.ui);

  const roles = user?.roles ?? [];
  const resolvedActiveRole: Role | null =
    (activeRole && roles.includes(activeRole) ? activeRole : null) ||
    ROLE_PRIORITY.find((role) => roles.includes(role)) ||
    null;

  return {
    user,
    isAuthenticated,
    isReady: status === 'ready',
    roles,
    activeRole: resolvedActiveRole,
    hasRole: (role: Role) => roles.includes(role),
  };
};
