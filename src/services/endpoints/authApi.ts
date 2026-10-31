import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { User, Role } from '../../types/domain';

export const authApi = {
  register: (payload: { name: string; email: string; password: string; roles?: Role[] }) =>
    api.post<ApiEnvelope<{ user: User }>>('/auth/register', payload),

  login: (payload: { email: string; password: string }) =>
    api.post<ApiEnvelope<{ user: User }>>('/auth/login', payload),

  logout: () => api.post<ApiEnvelope<Record<string, never>>>('/auth/logout'),

  me: () => api.get<ApiEnvelope<User>>('/auth/me'),
};
