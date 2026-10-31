import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type {
  Workout,
  WorkoutLog,
  AthleteInsights,
  AthleteHomeData,
  Comment,
} from '../../types/domain';

export interface CreateWorkoutPayload {
  date: string;
  title: string;
  items: { exerciseId: string; sets: number; reps: number; targetWeightKg?: number | null; restSec?: number; notes?: string }[];
}

export interface LogWorkoutPayload {
  workoutId?: string | null;
  date?: string;
  items: { exerciseId: string; sets: { reps: number; weightKg: number }[] }[];
  durationMin?: number;
  perceivedEffort?: number | null;
  painFlag?: boolean;
  notes?: string;
}

export const athleteApi = {
  getHome: (athleteId: string) => api.get<ApiEnvelope<AthleteHomeData>>(`/athletes/${athleteId}/home`),

  listWorkouts: (athleteId: string, params: { from?: string; to?: string } = {}) =>
    api.get<ApiEnvelope<Workout[]>>(`/athletes/${athleteId}/workouts`, { params }),

  createWorkout: (athleteId: string, payload: CreateWorkoutPayload) =>
    api.post<ApiEnvelope<Workout>>(`/athletes/${athleteId}/workouts`, payload),

  updateWorkout: (athleteId: string, workoutId: string, payload: Partial<CreateWorkoutPayload & { status: string }>) =>
    api.patch<ApiEnvelope<Workout>>(`/athletes/${athleteId}/workouts/${workoutId}`, payload),

  logWorkout: (athleteId: string, payload: LogWorkoutPayload) =>
    api.post<ApiEnvelope<WorkoutLog>>(`/athletes/${athleteId}/logs`, payload),

  listLogs: (athleteId: string) => api.get<ApiEnvelope<WorkoutLog[]>>(`/athletes/${athleteId}/logs`),

  getInsights: (athleteId: string) => api.get<ApiEnvelope<AthleteInsights>>(`/athletes/${athleteId}/insights`),

  checkIn: (athleteId: string) => api.post<ApiEnvelope<unknown>>(`/athletes/${athleteId}/checkins`),

  listComments: (athleteId: string, params: { workoutId?: string; workoutLogId?: string }) =>
    api.get<ApiEnvelope<Comment[]>>(`/athletes/${athleteId}/comments`, { params }),

  createComment: (athleteId: string, payload: { workoutId?: string; workoutLogId?: string; text: string }) =>
    api.post<ApiEnvelope<Comment>>(`/athletes/${athleteId}/comments`, payload),
};
