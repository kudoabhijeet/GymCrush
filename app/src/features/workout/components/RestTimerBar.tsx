import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { haptics } from '@/lib/haptics';
import { durations } from '@/lib/motion';
import { formatClock } from '@/lib/format';
import { useActiveSessionStore } from '../activeSessionStore';

/**
 * The rest countdown. Owns its own 1Hz clock — isolating the tick here is
 * what keeps the rest of the logger from re-rendering every second — plus the
 * rest-done haptic and the ±15s adjustments.
 */
export function RestTimerBar() {
  const restTimer = useActiveSessionStore((s) => s.restTimer);
  const skipRest = useActiveSessionStore((s) => s.skipRest);
  const adjustRest = useActiveSessionStore((s) => s.adjustRest);
  const [now, setNow] = useState(() => Date.now());

  // Fires the rest-done haptic exactly once per rest period, keyed by the
  // deadline — ±15s moves the deadline and re-arms it; Skip stays silent.
  const firedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (!restTimer) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      const n = Date.now();
      setNow(n);
      // Nothing left to count — stop ticking until the timer changes.
      if (n >= restTimer.endsAt) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    if (!restTimer) return;
    if (now < restTimer.endsAt) return;
    if (firedForRef.current === restTimer.endsAt) return;
    firedForRef.current = restTimer.endsAt;
    haptics.restDone();
  }, [now, restTimer]);

  const remaining = restTimer ? Math.ceil((restTimer.endsAt - now) / 1000) : 0;
  if (!restTimer || remaining <= 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(durations.enter)}
      exiting={FadeOut.duration(durations.exit)}
      className="mx-5 mb-2 gap-2 rounded-2xl bg-brand/10 p-3"
    >
      <View className="flex-row items-center justify-between">
        <AppText className="font-bold text-[15px] text-brand-text">
          Rest · {formatClock(remaining)}
        </AppText>
        <View className="flex-row items-center gap-4">
          <PressableScale
            onPress={() => adjustRest(-15)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Shorten rest by 15 seconds"
          >
            <AppText variant="caption" className="font-bold text-brand-text">
              −15
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={() => adjustRest(15)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Extend rest by 15 seconds"
          >
            <AppText variant="caption" className="font-bold text-brand-text">
              +15
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={skipRest}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Skip rest"
          >
            <AppText variant="caption" className="font-semibold text-content-muted">
              Skip
            </AppText>
          </PressableScale>
        </View>
      </View>
      <ProgressBar
        progress={remaining / restTimer.durationSec}
        height={4}
        accessibilityLabel="Rest remaining"
      />
    </Animated.View>
  );
}
