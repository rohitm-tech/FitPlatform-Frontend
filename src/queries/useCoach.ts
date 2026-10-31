import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachApi } from '../services/endpoints/coachApi';
import type { CreateTemplatePayload } from '../services/endpoints/coachApi';

export const useMyAthletes = () =>
  useQuery({
    queryKey: ['coach-athletes'],
    queryFn: async () => (await coachApi.listAthletes()).data.data,
  });

export const useInviteAthlete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => coachApi.inviteAthlete(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach-athletes'] }),
  });
};

export const useTemplates = () =>
  useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await coachApi.listTemplates()).data.data,
  });

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => coachApi.createTemplate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useAssignTemplate = () =>
  useMutation({
    mutationFn: ({ templateId, athleteIds, dates }: { templateId: string; athleteIds: string[]; dates: string[] }) =>
      coachApi.assignTemplate(templateId, athleteIds, dates),
  });
