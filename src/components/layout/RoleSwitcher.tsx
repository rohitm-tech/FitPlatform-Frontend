import { useNavigate } from 'react-router-dom';
import { useAuth, roleHomePath } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/hooks';
import { setActiveRole } from '../../store/slices/uiSlice';
import type { Role } from '../../types/domain';

const ROLE_LABEL: Record<Role, string> = {
  athlete: 'Athlete',
  coach: 'Coach',
  gym_owner: 'Gym Owner',
  admin: 'Admin',
};

// Shown only when a user holds more than one role (e.g. coach + athlete).
// Switching areas is a client-side convenience; every request in the new
// area is still re-authorized by the backend's role/ownership middleware.
export const RoleSwitcher = () => {
  const { roles, activeRole } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (roles.length <= 1) return null;

  return (
    <select
      className="fp-input !w-auto py-1.5 text-sm"
      value={activeRole ?? ''}
      onChange={(event) => {
        const role = event.target.value as Role;
        dispatch(setActiveRole(role));
        navigate(roleHomePath(role));
      }}
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  );
};
