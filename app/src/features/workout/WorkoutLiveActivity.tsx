import { Capsule, Gauge, HStack, Image, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  layoutPriority,
  lineLimit,
  monospacedDigit,
  padding,
  progressViewStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { WorkoutActivityProps } from './workoutActivityProps';

/**
 * Live Activity layout. Keep all logic inside this function — the widgets babel
 * plugin stringifies it for the extension JS runtime, which has no access to
 * module-level helpers or sub-components.
 *
 * Two renderer constraints that are invisible until a native build:
 * - Never use `containerRelativeFrame`: it sizes against the activity container,
 *   not the padded parent, so it overflows a padded stack on iOS 17+ — and it is
 *   gated behind `#available(iOS 17)`, so on 16.4 it silently does nothing and
 *   the stack hugs its content instead. Fill width with a trailing `Spacer`.
 * - `Gauge`'s label slots are dropped: the widget renderer builds `GaugeView`
 *   without children, so `currentValueLabel` never reaches SwiftUI. Layer the
 *   label over the gauge with a `ZStack` instead.
 */
const WorkoutActivity = (props: WorkoutActivityProps, environment: LiveActivityEnvironment) => {
  'widget';

  // Explicit hexes only — never rely on system default text (caused the maroon
  // "Push A" on dark Lock Screen in v1).
  const dark = environment.colorScheme === 'dark';
  const content = dark ? '#f4f6f5' : '#161a17';
  const contentMuted = dark ? '#9aa4a2' : '#57625c';
  const brandText = dark ? '#ccff00' : '#4d7c0f';
  const surfaceElevated = dark ? '#14181a' : '#ffffff';
  const surfaceMuted = dark ? '#1f2528' : '#e7ece6';
  // Dim the brand accent when the system can't vouch for the content (always-on
  // display, or a stale activity the app hasn't refreshed).
  const accent = environment.isLuminanceReduced || environment.isStale ? contentMuted : brandText;

  const resting = props.restStartedAt != null && props.restEndsAt != null;
  const restLower = resting ? new Date(props.restStartedAt!) : null;
  const restUpper = resting ? new Date(props.restEndsAt!) : null;
  const startedAt = new Date(props.startedAt);

  const setsMeta = `${props.setsDone}/${props.setsTotal} sets`;
  const exercisesMeta = `${props.exercisesDone}/${props.exercisesTotal} exercises`;
  const metaLine = `${exercisesMeta} · ${setsMeta}`;
  const setFraction =
    props.currentSetNumber != null && props.currentExerciseSetsTotal > 0
      ? `Set ${props.currentSetNumber}/${props.currentExerciseSetsTotal}`
      : setsMeta;
  const compactTrailingText =
    props.currentSetNumber != null && props.currentExerciseSetsTotal > 0
      ? `${props.currentSetNumber}/${props.currentExerciseSetsTotal}`
      : `${props.setsDone}/${props.setsTotal}`;
  const allDone = props.setsTotal > 0 && props.setsDone >= props.setsTotal;
  const exerciseTitle = allDone
    ? 'Workout complete'
    : (props.currentExerciseName ?? props.workoutName);
  // While resting, the last logged set is the most useful thing to show; fall
  // back to the session meta so the row is never empty (height stays fixed).
  const bottomLine = resting ? (props.lastSetLabel ?? metaLine) : metaLine;
  const sessionCount = `${props.setsDone}/${props.setsTotal}`;
  const workoutSymbol = 'figure.strengthtraining.traditional';

  // A segmented bar reads well up to 8 sets; past that it turns into mush, so
  // fall back to a continuous bar driven by the ratio the props builder already
  // computes. Both branches are 6pt tall so the card never reflows.
  const segmented = props.currentExerciseSetsTotal <= 8;
  const barHeight = 6;
  const stepCount = allDone ? 1 : Math.max(1, Math.min(props.currentExerciseSetsTotal, 8));
  const stepsFilled = Math.min(allDone ? 1 : props.currentExerciseSetsDone, stepCount);

  const bannerModifiers = [
    padding({ horizontal: 16, vertical: 12 }),
    // Both background APIs get the same color: iOS honours one or the other
    // depending on version/context, and mismatched values make the card change
    // shade between them.
    containerBackground(surfaceElevated, 'widget'),
    activityBackgroundTint(surfaceElevated),
  ];
  // The .small activity family (Watch Smart Stack, CarPlay) gets a much smaller
  // slot than the Lock Screen, so it takes tighter insets.
  const bannerSmallModifiers = [
    padding({ horizontal: 12, vertical: 10 }),
    containerBackground(surfaceElevated, 'widget'),
    activityBackgroundTint(surfaceElevated),
  ];

  const progressRow = segmented ? (
    <HStack spacing={3}>
      {Array.from({ length: stepCount }, (_, i) => (
        <Capsule
          key={i}
          modifiers={[
            frame({ height: barHeight }),
            layoutPriority(1),
            foregroundStyle(i < stepsFilled ? accent : surfaceMuted),
          ]}
        />
      ))}
    </HStack>
  ) : (
    <ProgressView
      value={props.exerciseProgress}
      modifiers={[progressViewStyle('linear'), tint(accent), frame({ height: barHeight })]}
    />
  );

  // Both are built only while resting: the Text/ProgressView wrappers call
  // .getTime() on the interval bounds, so constructing them eagerly would throw
  // on every non-resting render and blank the whole layout.
  const restBar = resting ? (
    <ProgressView
      timerInterval={{ lower: restLower!, upper: restUpper! }}
      countsDown
      modifiers={[progressViewStyle('linear'), tint(accent), frame({ height: barHeight })]}
    />
  ) : null;

  // `timerInterval` + countsDown, never `date`/`dateStyle="timer"` — the latter
  // keeps counting upward once rest expires instead of settling on 0:00.
  const restCountdown = resting ? (
    <Text
      timerInterval={{ lower: restLower!, upper: restUpper! }}
      countsDown
      modifiers={[
        font({ weight: 'bold', size: 20 }),
        foregroundStyle(accent),
        monospacedDigit(),
      ]}
    />
  ) : null;

  return {
    banner: (
      <HStack spacing={0} alignment="center" modifiers={bannerModifiers}>
        <VStack spacing={8} alignment="leading">
          <HStack spacing={6} alignment="center">
            <Image systemName={workoutSymbol} color={accent} size={13} />
            <Text
              modifiers={[
                font({ weight: 'semibold', size: 13 }),
                foregroundStyle(contentMuted),
                lineLimit(1),
              ]}
            >
              {props.workoutName}
            </Text>
            <Spacer minLength={4} />
            <Text
              date={startedAt}
              dateStyle="timer"
              modifiers={[font({ size: 12 }), foregroundStyle(contentMuted), monospacedDigit()]}
            />
          </HStack>

          <HStack spacing={8} alignment="firstTextBaseline">
            <Text
              modifiers={[
                font({ weight: 'bold', size: 20 }),
                foregroundStyle(content),
                lineLimit(1),
              ]}
            >
              {exerciseTitle}
            </Text>
            <Spacer minLength={8} />
            {resting ? (
              restCountdown
            ) : (
              <Text
                modifiers={[
                  font({ weight: 'semibold', size: 15 }),
                  foregroundStyle(contentMuted),
                  monospacedDigit(),
                ]}
              >
                {setFraction}
              </Text>
            )}
          </HStack>

          {resting ? restBar : progressRow}

          <Text
            modifiers={[font({ size: 12 }), foregroundStyle(contentMuted), lineLimit(1)]}
          >
            {bottomLine}
          </Text>
        </VStack>
        {/* Forces the column to the full padded width in every state. */}
        <Spacer minLength={0} />
      </HStack>
    ),

    bannerSmall: (
      <HStack spacing={0} alignment="center" modifiers={bannerSmallModifiers}>
        <VStack spacing={4} alignment="leading">
          <Text
            modifiers={[
              font({ weight: 'bold', size: 15 }),
              foregroundStyle(content),
              lineLimit(1),
            ]}
          >
            {exerciseTitle}
          </Text>
          {resting ? (
            <Text
              timerInterval={{ lower: restLower!, upper: restUpper! }}
              countsDown
              modifiers={[
                font({ weight: 'semibold', size: 14 }),
                foregroundStyle(accent),
                monospacedDigit(),
              ]}
            />
          ) : (
            <Text
              modifiers={[
                font({ size: 13 }),
                foregroundStyle(contentMuted),
                monospacedDigit(),
                lineLimit(1),
              ]}
            >
              {setFraction}
            </Text>
          )}
        </VStack>
        <Spacer minLength={0} />
      </HStack>
    ),

    compactLeading: <Image systemName={resting ? 'timer' : workoutSymbol} color={accent} size={14} />,
    compactTrailing: resting ? (
      <Text
        timerInterval={{ lower: restLower!, upper: restUpper! }}
        countsDown
        modifiers={[
          font({ weight: 'semibold', size: 14 }),
          foregroundStyle(accent),
          monospacedDigit(),
        ]}
      />
    ) : (
      <Text
        modifiers={[
          font({ weight: 'semibold', size: 14 }),
          foregroundStyle(content),
          monospacedDigit(),
        ]}
      >
        {compactTrailingText}
      </Text>
    ),
    minimal: <Image systemName={resting ? 'timer' : workoutSymbol} color={accent} size={14} />,

    // The expanded regions carry their own system insets — extra padding here
    // squeezes the centre region to nothing.
    expandedLeading: (
      <VStack spacing={2} alignment="leading">
        <Image systemName={workoutSymbol} color={accent} size={16} />
        <Text
          date={startedAt}
          dateStyle="timer"
          modifiers={[font({ size: 11 }), foregroundStyle(contentMuted), monospacedDigit()]}
        />
      </VStack>
    ),
    expandedCenter: (
      <Text
        modifiers={[font({ size: 12 }), foregroundStyle(contentMuted), lineLimit(1)]}
      >
        {props.workoutName}
      </Text>
    ),
    expandedTrailing: resting ? (
      restCountdown
    ) : (
      <ZStack alignment="center" modifiers={[frame({ width: 44, height: 44 })]}>
        <Gauge value={props.sessionProgress} modifiers={[gaugeStyle('circular'), tint(accent)]} />
        <Text
          modifiers={[
            font({ weight: 'bold', size: 11 }),
            foregroundStyle(content),
            monospacedDigit(),
          ]}
        >
          {sessionCount}
        </Text>
      </ZStack>
    ),
    expandedBottom: (
      <HStack spacing={0} alignment="center" modifiers={[padding({ horizontal: 4 })]}>
        <VStack spacing={6} alignment="leading">
          <Text
            modifiers={[
              font({ weight: 'semibold', size: 16 }),
              foregroundStyle(content),
              lineLimit(1),
            ]}
          >
            {exerciseTitle}
          </Text>
          {resting ? restBar : progressRow}
          <Text modifiers={[font({ size: 12 }), foregroundStyle(contentMuted), lineLimit(1)]}>
            {bottomLine}
          </Text>
        </VStack>
        <Spacer minLength={0} />
      </HStack>
    ),
  };
};

export default createLiveActivity('WorkoutActivity', WorkoutActivity);
