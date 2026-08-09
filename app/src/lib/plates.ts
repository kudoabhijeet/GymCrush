export type PlateUnit = 'kg' | 'lb';

/** Standard Olympic plate denominations, heaviest first. */
export const PLATES: Record<PlateUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

/** Common bar weights, defaulting to the men's Olympic bar. */
export const BAR_WEIGHTS: Record<PlateUnit, number[]> = {
  kg: [20, 15, 10],
  lb: [45, 35, 25],
};

export interface PlateLoad {
  /** Plates to load on each side, heaviest first. */
  perSide: number[];
  /** Weight actually achievable with these plates. */
  loadedTotal: number;
  /** Shortfall from the requested target (0 when exactly loadable). */
  diff: number;
}

/**
 * Greedy heaviest-first plate breakdown per side. Not every target is loadable
 * with a given plate set, so `loadedTotal`/`diff` report what's actually
 * achievable rather than pretending the target was hit.
 */
export function calcPlateLoad(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[],
): PlateLoad {
  const perSideTarget = (targetWeight - barWeight) / 2;
  if (!Number.isFinite(perSideTarget) || perSideTarget <= 0) {
    return { perSide: [], loadedTotal: barWeight, diff: Math.max(0, targetWeight - barWeight) };
  }

  const perSide: number[] = [];
  let remaining = perSideTarget;
  for (const plate of [...availablePlates].sort((a, b) => b - a)) {
    while (remaining >= plate - 1e-9) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const loadedTotal = barWeight + perSide.reduce((sum, p) => sum + p, 0) * 2;
  return {
    perSide,
    loadedTotal,
    diff: Math.round((targetWeight - loadedTotal) * 100) / 100,
  };
}
