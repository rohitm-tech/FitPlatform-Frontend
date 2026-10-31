import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { CoachAthleteSummary, InvitedAthlete, WorkoutTemplate } from '../../types/domain';

export interface CreateTemplatePayload {
  title: string;
  items: { exerciseId: string; sets: number; reps: number; targetWeightKg?: number | null; restSec?: number; notes?: string }[];
}

export const coachApi = {
  listAthletes: () =>
    api.get<ApiEnvelope<{ athletes: CoachAthleteSummary[]; invited: InvitedAthlete[] }>>('/coach/athletes'),

  inviteAthlete: (email: string) => api.post<ApiEnvelope<unknown>>('/coach/athletes/invite', { email }),

  listTemplates: () => api.get<ApiEnvelope<WorkoutTemplate[]>>('/coach/templates'),

  createTemplate: (payload: CreateTemplatePayload) =>
    api.post<ApiEnvelope<WorkoutTemplate>>('/coach/templates', payload),

  assignTemplate: (templateId: string, athleteIds: string[], dates: string[]) =>
    api.post<ApiEnvelope<unknown>>(`/coach/templates/${templateId}/assign`, { athleteIds, dates }),
};
