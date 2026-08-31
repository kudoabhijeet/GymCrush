/**
 * Canonical motion tokens. Every Reanimated duration/spring in the app comes
 * from here so interactions feel like one system — pick the semantic closest
 * to the gesture instead of inventing new values inline.
 */

export const durations = {
  /** Press-in scale (release is a spring, see `springs.press`). */
  press: 80,
  /** Fades/slides out — dismissals, exits. */
  exit: 150,
  /** Fades/slides in — entrances, reveals. */
  enter: 180,
  /** Progress-bar fill sweep. */
  sweep: 600,
  /** One-shot celebration decay — the PR glow fading back out. */
  glow: 700,
  /** Skeleton pulse half-cycle (one direction of the loop). */
  pulse: 700,
  /** Progress-ring fill sweep — slower than the bar; it's a hero element. */
  ringSweep: 900,
} as const;

export const springs = {
  /** Press release back to rest (PressableScale). */
  press: { damping: 18, stiffness: 300 },
  /** Indicators and small position moves (SegmentedControl thumb). */
  snappy: { damping: 26, stiffness: 260, mass: 0.9 },
  /** Modal/sheet slide-in. */
  sheet: { damping: 22, stiffness: 240 },
  /** Celebration overshoot (PR pop)… */
  pop: { damping: 8, stiffness: 320 },
  /** …and the settle back to rest after it. */
  settle: { damping: 14, stiffness: 260 },
} as const;

/**
 * Named press-scale depths for PressableScale's `scaleTo`, by target size:
 * big surfaces move least, small targets dip further so the feedback reads.
 */
export const pressScale = {
  card: 0.98,
  button: 0.97,
  chip: 0.95,
  icon: 0.9,
  /** Tiny high-frequency targets (the set-complete check). */
  stamp: 0.85,
} as const;
