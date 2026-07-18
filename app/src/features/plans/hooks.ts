import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpsertPlanInput, WorkoutPlan } from '@gymcrush/shared';
import { api } from '@/lib/api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<WorkoutPlan[]> => {
      const { plans } = await api<{ plans: WorkoutPlan[] }>('/api/plans');
      return plans;
    },
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: ['plans', id],
    enabled: !!id,
    queryFn: async (): Promise<WorkoutPlan | null> => {
      const { plan } = await api<{ plan: WorkoutPlan }>(`/api/plans/${id}`);
      return plan;
    },
  });
}

/** Create (no id) or update (id given) a plan from the editor form. */
export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: UpsertPlanInput }) => {
      const { plan } = id
        ? await api<{ plan: WorkoutPlan }>(`/api/plans/${id}`, { method: 'PUT', body: input })
        : await api<{ plan: WorkoutPlan }>('/api/plans', { method: 'POST', body: input });
      return plan;
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', plan.id] });
    },
  });
}

export function useDuplicatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { plan } = await api<{ plan: WorkoutPlan }>(`/api/plans/${id}/duplicate`, {
        method: 'POST',
      });
      return plan;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api<void>(`/api/plans/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}
