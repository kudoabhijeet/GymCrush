import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateExerciseInput, Exercise, MuscleGroup } from '@gymcrush/shared';
import { api } from '@/lib/api';
import { CATALOG_GC_MS, CATALOG_STALE_MS } from '@/lib/queryClient';

/**
 * Module-level catalog cache. `exerciseLookup(id)` is called synchronously from
 * render in many screens (session summaries, plan detail, the logger), so we
 * keep a Map warm from the exercises query and read it without awaiting.
 */
const catalog = new Map<string, Exercise>();

function primeCatalog(exercises: Exercise[]) {
  for (const ex of exercises) catalog.set(ex.id, ex);
}

/** Synchronous catalog lookup for rendering names/muscle groups in lists. */
export function exerciseLookup(id: string): Exercise | undefined {
  return catalog.get(id);
}

/**
 * Prefetch the full exercise catalog once (global + custom) and keep the
 * synchronous lookup map warm. Call once high in the tree (root layout);
 * `enabled` should track authentication since the endpoint requires a token.
 */
export function useExerciseCatalog(enabled = true) {
  const query = useQuery({
    queryKey: ['exercises', '', 'all'],
    enabled,
    queryFn: async (): Promise<Exercise[]> => {
      const { exercises } = await api<{ exercises: Exercise[] }>('/api/exercises');
      return exercises;
    },
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });

  useEffect(() => {
    if (query.data) primeCatalog(query.data);
  }, [query.data]);

  return query;
}

export function useExercises(search = '', muscleGroup?: MuscleGroup) {
  const query = useQuery({
    queryKey: ['exercises', search, muscleGroup ?? 'all'],
    queryFn: async (): Promise<Exercise[]> => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (muscleGroup) params.set('muscleGroup', muscleGroup);
      const qs = params.toString();
      const { exercises } = await api<{ exercises: Exercise[] }>(
        `/api/exercises${qs ? `?${qs}` : ''}`,
      );
      return exercises;
    },
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
    // Keep showing the previous matches while the next query resolves, so the
    // list doesn't flash empty between keystrokes.
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (query.data) primeCatalog(query.data);
  }, [query.data]);

  return query;
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExerciseInput): Promise<Exercise> => {
      const { exercise } = await api<{ exercise: Exercise }>('/api/exercises', {
        method: 'POST',
        body: input,
      });
      catalog.set(exercise.id, exercise);
      return exercise;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}
