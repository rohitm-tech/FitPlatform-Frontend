import { api } from '../api';
import type { ApiEnvelope } from '../../types/api';
import type { CoachAthleteSummary, InvitedAthlete, WorkoutTemplate } from '../../types/domain';

export interface SessionPiecePayload {
  kind: 'strength' | 'swim' | 'endurance' | 'station' | 'rounds' | 'practice';
  label?: string;
  exerciseId?: string;
  sets?: number;
  reps?: number | null;
  targetWeightKg?: number | null;
  restSec?: number;
  distanceM?: number | null;
  durationSec?: number | null;
  paceSec?: number | null;
  stroke?: string;
  metric?: 'reps' | 'distance' | 'time';
  effort?: number | null;
  notes?: string;
}

export interface CreateTemplatePayload {
  title: string;
  sport: string;
  items: SessionPiecePayload[];
}

export const coachApi = {
  listAthletes: () =>
    api.get<ApiEnvelope<{ athletes: CoachAthleteSummary[]; invited: InvitedAthlete[] }>>('/coach/athletes'),

  inviteAthlete: (email: string, sport: string) =>
    api.post<ApiEnvelope<unknown>>('/coach/athletes/invite', { email, sport }),

  listTemplates: () => api.get<ApiEnvelope<WorkoutTemplate[]>>('/coach/templates'),

  createTemplate: (payload: CreateTemplatePayload) =>
    api.post<ApiEnvelope<WorkoutTemplate>>('/coach/templates', payload),

  assignTemplate: (templateId: string, athleteIds: string[], dates: string[]) =>
    api.post<ApiEnvelope<unknown>>(`/coach/templates/${templateId}/assign`, { athleteIds, dates }),
};
