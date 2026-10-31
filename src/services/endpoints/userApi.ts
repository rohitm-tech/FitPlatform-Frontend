import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { User, UserProfile } from '../../types/domain';

export const userApi = {
  completeOnboarding: (payload: UserProfile) =>
    api.post<ApiEnvelope<User>>('/users/onboarding', payload),

  exportMyData: () => api.get<ApiEnvelope<{ user: User }>>('/users/me/export'),

  deleteMyAccount: () => api.delete<ApiEnvelope<Record<string, never>>>('/users/me'),
};
