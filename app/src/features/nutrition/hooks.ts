import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BodyProfile,
  CreateFoodInput,
  DailyLog,
  Food,
  Macros,
  MacroTarget,
  Meal,
  UpsertBodyProfileInput,
  WeightEntry,
} from '@gymcrush/shared';
import { api } from '@/lib/api';
import { CATALOG_GC_MS, CATALOG_STALE_MS } from '@/lib/queryClient';
import { useProfileStore } from '@/features/profile/profileStore';

export interface ProfileWithTarget {
  profile: BodyProfile;
  target: MacroTarget;
}

/** Upsert the body profile; the server recomputes and returns macro targets. */
export function useUpsertBodyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertBodyProfileInput): Promise<ProfileWithTarget> => {
      return api<ProfileWithTarget>('/api/nutrition/profile', { method: 'PUT', body: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-profile'] });
      queryClient.invalidateQueries({ queryKey: ['macro-target'] });
    },
  });
}

/** Compute macros from a food + servings (for the add-food preview sheet). */
export function foodMacros(food: Food, servings: number): Macros {
  return {
    calories: Math.round(food.calories * servings),
    proteinG: Math.round(food.proteinG * servings),
    carbsG: Math.round(food.carbsG * servings),
    fatG: Math.round(food.fatG * servings),
  };
}

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['food-log', date],
    queryFn: async (): Promise<DailyLog> => {
      const { log } = await api<{ log: DailyLog }>(`/api/nutrition/log?date=${date}`);
      return log;
    },
  });
}

export function useFoods(search = '') {
  return useQuery({
    queryKey: ['foods', search],
    queryFn: async (): Promise<Food[]> => {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const { foods } = await api<{ foods: Food[] }>(`/api/nutrition/foods${qs}`);
      return foods;
    },
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
    // Hold the previous matches while the next search resolves.
    placeholderData: (prev) => prev,
  });
}

export function useAddFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { date: string; foodId: string; servings: number; meal: Meal }) => {
      const { log } = await api<{ log: DailyLog }>('/api/nutrition/log', {
        method: 'POST',
        body: input,
      });
      return log;
    },
    onSuccess: (_log, variables) =>
      queryClient.invalidateQueries({ queryKey: ['food-log', variables.date] }),
  });
}

export function useRemoveFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { date: string; entryId: string }) => {
      await api<void>(`/api/nutrition/log/entries/${input.entryId}`, { method: 'DELETE' });
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['food-log', variables.date] }),
  });
}

export function useCreateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFoodInput): Promise<Food> => {
      const { food } = await api<{ food: Food }>('/api/nutrition/foods', {
        method: 'POST',
        body: input,
      });
      return food;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foods'] }),
  });
}

export function useWeightHistory() {
  return useQuery({
    queryKey: ['weight-history'],
    queryFn: async (): Promise<WeightEntry[]> => {
      const { history } = await api<{ history: WeightEntry[] }>('/api/nutrition/weight');
      return history;
    },
  });
}

/** Patch profile store weight when the latest weigh-in changes (no refetch). */
function syncProfileWeight(weightKg: number) {
  const { bodyProfile, macroTarget, setBodyProfile } = useProfileStore.getState();
  if (!bodyProfile || !macroTarget) return;
  if (bodyProfile.weightKg === weightKg) return;
  setBodyProfile({ ...bodyProfile, weightKg }, macroTarget);
}

/** Re-load profile + targets from the server (e.g. after clearing the weight log). */
async function refreshProfileFromServer() {
  const hydrateProfile = useProfileStore.getState().hydrateFromServer;
  try {
    const [{ profile }, { target }] = await Promise.all([
      api<{ profile: BodyProfile }>('/api/nutrition/profile'),
      api<{ target: MacroTarget }>('/api/nutrition/targets'),
    ]);
    hydrateProfile(profile, target);
  } catch {
    // Transient failure — leave the store as-is.
  }
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (weightKg: number): Promise<WeightEntry> => {
      const { entry } = await api<{ entry: WeightEntry }>('/api/nutrition/weight', {
        method: 'POST',
        body: { weightKg },
      });
      return entry;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<WeightEntry[]>(['weight-history'], (prev) =>
        prev ? [...prev, entry] : [entry],
      );
      syncProfileWeight(entry.weightKg);
    },
  });
}

export function useUpdateWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; weightKg: number }): Promise<WeightEntry> => {
      const { entry } = await api<{ entry: WeightEntry }>(`/api/nutrition/weight/${input.id}`, {
        method: 'PATCH',
        body: { weightKg: input.weightKg },
      });
      return entry;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<WeightEntry[]>(['weight-history'], (prev) => {
        if (!prev) return [entry];
        const next = prev.map((e) => (e.id === entry.id ? entry : e));
        const latest = next[next.length - 1];
        if (latest?.id === entry.id) syncProfileWeight(entry.weightKg);
        return next;
      });
    },
  });
}

export function useDeleteWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      await api<void>(`/api/nutrition/weight/${id}`, { method: 'DELETE' });
      return id;
    },
    onSuccess: (id) => {
      let historyEmpty = false;
      queryClient.setQueryData<WeightEntry[]>(['weight-history'], (prev) => {
        if (!prev) return prev;
        const wasLatest = prev[prev.length - 1]?.id === id;
        const next = prev.filter((e) => e.id !== id);
        if (wasLatest) {
          if (next.length > 0) {
            syncProfileWeight(next[next.length - 1].weightKg);
          } else {
            historyEmpty = true;
          }
        }
        return next;
      });
      if (historyEmpty) {
        void refreshProfileFromServer();
      }
    },
  });
}
