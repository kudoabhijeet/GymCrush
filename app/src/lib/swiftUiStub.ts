/**
 * Metro resolves `@expo/ui/swift-ui` imports to this stub in the main app bundle.
 * WorkoutLiveActivity's layout is stringified by the widgets babel plugin and
 * evaluated in the widget extension's JS runtime, so these are never called at
 * runtime here — stubbing them keeps expo-ui's native views out of the app graph
 * (they break NativeWind's CssInterop).
 *
 * The shapes mirror the widget runtime exactly — `expo-widgets/bundle/expo-stub.ts`
 * builds `{ type, props }` nodes and `@expo/ui`'s `createModifier` builds
 * `{ $type, ...params }` — so `vitest.config.mts` aliases the same file to make the
 * layout function assertable without a native build. Keep them faithful.
 */

type Node = { type: string; props: Record<string, unknown> };
type Modifier = { $type: string; [key: string]: unknown };

const view =
  (type: string) =>
  (props: Record<string, unknown> = {}): Node => ({ type, props });

const modifier =
  (type: string) =>
  (...params: unknown[]): Modifier =>
    ({ $type: type, params });

export const Text = view('TextView');
export const VStack = view('VStackView');
export const HStack = view('HStackView');
export const ZStack = view('ZStackView');
export const Image = view('ImageView');
export const ProgressView = view('ProgressView');
export const Gauge = view('GaugeView');
export const Capsule = view('CapsuleView');
export const Spacer = view('SpacerView');

export const activityBackgroundTint = modifier('activityBackgroundTint');
export const containerBackground = modifier('containerBackground');
export const font = modifier('font');
export const foregroundStyle = modifier('foregroundStyle');
export const frame = modifier('frame');
export const gaugeStyle = modifier('gaugeStyle');
export const layoutPriority = modifier('layoutPriority');
export const lineLimit = modifier('lineLimit');
export const monospacedDigit = modifier('monospacedDigit');
export const padding = modifier('padding');
export const progressViewStyle = modifier('progressViewStyle');
export const tint = modifier('tint');
