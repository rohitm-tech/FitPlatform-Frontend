import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
export const usePerformance = () =>
  useQuery({
    queryKey: ['performance'],
    queryFn: async () => (await api.get('/performance/me')).data.data,
    refetchInterval: 10000,
  });
export const useCoachPerformance = () =>
  useQuery({
    queryKey: ['coach-performance'],
    queryFn: async () => (await api.get('/performance/coach')).data.data,
    refetchInterval: 10000,
  });
