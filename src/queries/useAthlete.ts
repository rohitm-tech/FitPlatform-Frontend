import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { athleteApi } from '../services/endpoints/athleteApi';
import type { CreateWorkoutPayload, LogWorkoutPayload } from '../services/endpoints/athleteApi';

export const useAthleteHome = (athleteId: string | undefined) =>
  useQuery({
    queryKey: ['athlete-home', athleteId],
    queryFn: async () => (await athleteApi.getHome(athleteId as string)).data.data,
    enabled: Boolean(athleteId),
  });

export const useAthleteWorkouts = (athleteId: string | undefined, params: { from?: string; to?: string } = {}) =>
  useQuery({
    queryKey: ['athlete-workouts', athleteId, params],
    queryFn: async () => (await athleteApi.listWorkouts(athleteId as string, params)).data.data,
    enabled: Boolean(athleteId),
  });

export const useAthleteInsights = (athleteId: string | undefined) =>
  useQuery({
    queryKey: ['athlete-insights', athleteId],
    queryFn: async () => (await athleteApi.getInsights(athleteId as string)).data.data,
    enabled: Boolean(athleteId),
  });

export const useCreateWorkout = (athleteId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkoutPayload) => athleteApi.createWorkout(athleteId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-workouts', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athlete-home', athleteId] });
    },
  });
};

export const useLogWorkout = (athleteId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogWorkoutPayload) => athleteApi.logWorkout(athleteId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-workouts', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athlete-home', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athlete-insights', athleteId] });
    },
  });
};

export const useUpdateWorkoutStatus = (athleteId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, status }: { workoutId: string; status: 'completed' | 'skipped' }) =>
      athleteApi.updateWorkout(athleteId as string, workoutId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-workouts', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athlete-home', athleteId] });
    },
  });
};

export const useCheckIn = (athleteId: string | undefined) =>
  useMutation({ mutationFn: () => athleteApi.checkIn(athleteId as string) });

export const useComments = (athleteId: string | undefined, params: { workoutId?: string; workoutLogId?: string }) =>
  useQuery({
    queryKey: ['comments', athleteId, params],
    queryFn: async () => (await athleteApi.listComments(athleteId as string, params)).data.data,
    enabled: Boolean(athleteId && (params.workoutId || params.workoutLogId)),
  });

export const useCreateComment = (athleteId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { workoutId?: string; workoutLogId?: string; text: string }) =>
      athleteApi.createComment(athleteId as string, payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', athleteId, { workoutId: variables.workoutId, workoutLogId: variables.workoutLogId }] });
    },
  });
};
