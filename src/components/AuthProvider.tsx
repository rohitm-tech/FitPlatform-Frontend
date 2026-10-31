import { queryClient } from '../queries/queryClient';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch } from '../store/hooks';
import { bootstrapAuth, clearUser } from '../store/slices/authSlice';

// Decouples axios from React/Redux: api.ts dispatches a plain window
// CustomEvent on a 401 response, and this listener translates that into a
// Redux action — axios never imports the store directly.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());

    const handleLogout = () => { queryClient.clear(); dispatch(clearUser()); };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [dispatch]);

  return <>{children}</>;
};
