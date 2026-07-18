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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weight-history'] }),
  });
}
