import { useQuery } from '@tanstack/react-query';
import { muscleApi } from '../services/endpoints/muscleApi';

export const useMuscles = () =>
  useQuery({
    queryKey: ['muscles'],
    queryFn: async () => (await muscleApi.list()).data.data,
  });

export const useMuscleDetail = (key: string | null) =>
  useQuery({
    queryKey: ['muscle', key],
    queryFn: async () => (await muscleApi.getByKey(key as string)).data.data,
    enabled: Boolean(key),
  });
