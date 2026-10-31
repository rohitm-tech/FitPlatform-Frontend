import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { Exercise } from '../../types/domain';

export interface ExerciseListParams {
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  type?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const exerciseApi = {
  list: (params: ExerciseListParams = {}) =>
    api.get<ApiEnvelope<{ exercises: Exercise[]; page: number; limit: number; total: number }>>('/exercises', {
      params,
    }),

  getBySlug: (slug: string) => api.get<ApiEnvelope<Exercise>>(`/exercises/${slug}`),
};
