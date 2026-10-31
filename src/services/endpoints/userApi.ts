import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { User, UserProfile } from '../../types/domain';

export const userApi = {
  completeOnboarding: (payload: Partial<UserProfile> & { name?: string }) =>
    api.post<ApiEnvelope<User>>('/users/onboarding', payload),

  exportMyData: () => api.get<ApiEnvelope<{ user: User }>>('/users/me/export'),

  deleteMyAccount: () => api.delete<ApiEnvelope<Record<string, never>>>('/users/me'),
};
