const KG_TO_LB = 2.20462;
const MS_PER_DAY = 86_400_000;

/** Local midnight for `date`, as epoch ms. */
export function startOfLocalDay(date: Date | number = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Ms from `now` until the next local midnight. */
export function msUntilNextLocalMidnight(now = Date.now()): number {
  return startOfLocalDay(now) + MS_PER_DAY - now;
}

/** Local yyyy-mm-dd key for a date (used as the daily food-log key). */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatWeight(kg: number | null | undefined, units: 'kg' | 'lb'): string {
  if (kg == null) return '—';
  if (units === 'lb') return `${Math.round(kg * KG_TO_LB * 10) / 10}`;
  return `${Math.round(kg * 10) / 10}`;
}

export function weightUnitLabel(units: 'kg' | 'lb'): string {
  return units;
}

export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return '—';
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${`${rem}`.padStart(2, '0')}`;
}

/** "6-8 reps" style target text from a plan prescription. */
export function formatPrescription(sets: number, reps: string, rpe: number | null): string {
  return `${sets} × ${reps}${rpe ? ` @ RPE ${rpe}` : ''}`;
}
