import { useQuery } from '@tanstack/react-query';
import { exerciseApi } from '../services/endpoints/exerciseApi';
import type { ExerciseListParams } from '../services/endpoints/exerciseApi';

export const useExercises = (params: ExerciseListParams) =>
  useQuery({
    queryKey: ['exercises', params],
    queryFn: async () => (await exerciseApi.list(params)).data.data,
  });

export const useExerciseDetail = (slug: string | undefined) =>
  useQuery({
    queryKey: ['exercise', slug],
    queryFn: async () => (await exerciseApi.getBySlug(slug as string)).data.data,
    enabled: Boolean(slug),
  });
