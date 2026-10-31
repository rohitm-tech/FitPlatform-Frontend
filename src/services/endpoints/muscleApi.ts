import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { Muscle, ExerciseSummary } from '../../types/domain';

export const muscleApi = {
  list: () => api.get<ApiEnvelope<Muscle[]>>('/muscles'),

  getByKey: (key: string) =>
    api.get<
      ApiEnvelope<{ muscle: Muscle; primaryExercises: ExerciseSummary[]; secondaryExercises: ExerciseSummary[] }>
    >(`/muscles/${key}`),
};
