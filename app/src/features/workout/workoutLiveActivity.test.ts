import { describe, expect, it, vi } from 'vitest';
import type { WorkoutActivityProps } from './workoutActivityProps';

// `createLiveActivity` only registers the layout natively; hand the function
// back so the test can call it the way the extension's JS runtime does.
vi.mock('expo-widgets', () => ({ createLiveActivity: (_name: string, fn: unknown) => fn }));

const layout = (await import('./WorkoutLiveActivity')).default as unknown as (
  props: WorkoutActivityProps,
  environment: Record<string, unknown>,
) => Record<string, Node>;

type Node = { type: string; props: Record<string, any> };
type Modifier = { $type: string; params: unknown[] };

const baseProps: WorkoutActivityProps = {
  workoutName: 'Push A',
  startedAt: 1_700_000_000_000,
  setsDone: 3,
  setsTotal: 12,
  exercisesDone: 1,
  exercisesTotal: 4,
  sessionProgress: 0.25,
  currentExerciseName: 'Bench Press',
  currentSetNumber: 2,
  currentExerciseSetsDone: 1,
  currentExerciseSetsTotal: 4,
  exerciseProgress: 0.25,
  lastSetLabel: null,
  restStartedAt: null,
  restEndsAt: null,
};

const restingProps: WorkoutActivityProps = {
  ...baseProps,
  lastSetLabel: '100 kg × 8 · Set 1',
  restStartedAt: 1_700_000_100_000,
  restEndsAt: 1_700_000_190_000,
};

const render = (props: WorkoutActivityProps, environment: Record<string, unknown> = {}) =>
  layout(props, { colorScheme: 'dark', ...environment });

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && 'type' in value && 'props' in value;
}

/** Every node in a region, depth-first. */
function walk(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(walk);
  if (!isNode(value)) return [];
  return [value, ...walk(value.props.children)];
}

const childrenOf = (node: Node): Node[] =>
  (Array.isArray(node.props.children) ? node.props.children : [node.props.children]).filter(isNode);

const modifiersOf = (node: Node): Modifier[] => (node.props.modifiers as Modifier[]) ?? [];

const modifier = (node: Node, type: string): Modifier | undefined =>
  modifiersOf(node).find((m) => m.$type === type);

describe('WorkoutLiveActivity layout', () => {
  it('renders every region in both rest states', () => {
    for (const props of [baseProps, restingProps]) {
      const regions = render(props);
      for (const name of [
        'banner',
        'bannerSmall',
        'compactLeading',
        'compactTrailing',
        'minimal',
        'expandedLeading',
        'expandedCenter',
        'expandedTrailing',
        'expandedBottom',
      ]) {
        expect(isNode(regions[name]), `${name} missing`).toBe(true);
      }
    }
  });

  it('closes the banner column with a Spacer so it fills the card width', () => {
    // Without it the leading-aligned column hugs its longest string and the
    // system centres it in the banner.
    for (const props of [baseProps, restingProps]) {
      const rootChildren = childrenOf(render(props).banner);
      expect(rootChildren.at(-1)?.type).toBe('SpacerView');
    }
  });

  it('never uses containerRelativeFrame', () => {
    // It measures against the activity container, not the padded parent, so it
    // overflows on iOS 17+ — and it is a no-op below 17, where the deployment
    // target still sits.
    for (const props of [baseProps, restingProps]) {
      const regions = render(props);
      const used = Object.values(regions)
        .flatMap(walk)
        .flatMap(modifiersOf)
        .map((m) => m.$type);
      expect(used).not.toContain('containerRelativeFrame');
    }
  });

  it('keeps the banner the same height across a rest transition', () => {
    const rows = (props: WorkoutActivityProps) =>
      childrenOf(childrenOf(render(props).banner)[0]).length;
    expect(rows(restingProps)).toBe(rows(baseProps));
  });

  it('paints the unfilled set segments against, not into, the card background', () => {
    const banner = render(baseProps).banner;
    const background = modifier(banner, 'activityBackgroundTint')?.params[0];
    const capsuleColors = walk(banner)
      .filter((n) => n.type === 'CapsuleView')
      .map((n) => modifier(n, 'foregroundStyle')?.params[0]);

    expect(capsuleColors.length).toBeGreaterThan(1);
    expect(background).toBeTruthy();
    expect(capsuleColors.every(Boolean)).toBe(true);
    // The track has to differ from the card, or empty segments vanish.
    expect(capsuleColors.filter((c) => c === background)).toHaveLength(0);
  });

  it('counts the banner rest timer down to zero rather than up past it', () => {
    // `date` + dateStyle="timer" keeps counting once the date passes.
    const timers = walk(render(restingProps).banner).filter(
      (n) => n.type === 'TextView' && n.props.timerInterval,
    );
    expect(timers).toHaveLength(1);
    expect(timers[0].props.countsDown).toBe(true);
    expect(timers[0].props.date).toBeUndefined();
  });

  it('layers the gauge label as a child, since Gauge label slots are dropped', () => {
    // The widget renderer builds GaugeView without children, so a
    // `currentValueLabel` prop never reaches SwiftUI.
    const trailing = render(baseProps).expandedTrailing;
    const gauge = walk(trailing).find((n) => n.type === 'GaugeView');

    expect(gauge?.props.currentValueLabel).toBeUndefined();
    expect(walk(trailing).some((n) => n.type === 'TextView')).toBe(true);
  });

  it('keeps the set bar present when the exercise has no sets yet', () => {
    const rows = childrenOf(
      childrenOf(render({ ...baseProps, currentExerciseSetsTotal: 0, currentExerciseSetsDone: 0 })
        .banner)[0],
    );
    expect(rows).toHaveLength(
      childrenOf(childrenOf(render(baseProps).banner)[0]).length,
    );
  });

  it('falls back to a continuous bar past eight sets, and never overfills it', () => {
    const many = render({
      ...baseProps,
      currentExerciseSetsTotal: 12,
      currentExerciseSetsDone: 11,
      exerciseProgress: 11 / 12,
    });
    const banner = walk(many.banner);
    expect(banner.filter((n) => n.type === 'CapsuleView')).toHaveLength(0);
    expect(banner.find((n) => n.type === 'ProgressView')?.props.value).toBeCloseTo(11 / 12);
  });

  it('drops the brand accent when the system cannot vouch for the content', () => {
    const accentOf = (environment: Record<string, unknown>) => {
      const banner = render(restingProps, environment).banner;
      const timer = walk(banner).find((n) => n.type === 'TextView' && n.props.timerInterval);
      return modifier(timer!, 'foregroundStyle')?.params[0];
    };

    const live = accentOf({});
    expect(accentOf({ isLuminanceReduced: true })).not.toBe(live);
    expect(accentOf({ isStale: true })).not.toBe(live);
  });
});
