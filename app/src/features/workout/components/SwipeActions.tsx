import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Flame, Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/lib/theme';

interface SwipeActionsProps {
  progress: SharedValue<number>;
  isWarmup: boolean;
  canDelete: boolean;
  onWarmup: () => void;
  onDelete: () => void;
  colors: ThemeColors;
}

/** Right-swipe actions on a set row: warmup toggle + delete. */
export function SwipeActions({
  progress,
  isWarmup,
  canDelete,
  onWarmup,
  onDelete,
  colors,
}: SwipeActionsProps) {
  // Fades in with the swipe rather than snapping in at full opacity.
  const style = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) }));

  return (
    <Animated.View style={style} className="flex-row items-stretch gap-2 pl-2">
      <PressableScale
        onPress={onWarmup}
        accessibilityLabel={isWarmup ? 'Unmark warmup set' : 'Mark warmup set'}
        className="w-[72px] items-center justify-center gap-1 rounded-xl bg-accent/15"
      >
        <Flame size={16} color={colors.accent} />
        <AppText variant="caption" className="font-semibold text-accent">
          {isWarmup ? 'Unwarm' : 'Warmup'}
        </AppText>
      </PressableScale>
      {canDelete ? (
        <PressableScale
          onPress={onDelete}
          accessibilityLabel="Delete set"
          className="w-[72px] items-center justify-center gap-1 rounded-xl bg-danger/15"
        >
          <Trash2 size={16} color={colors.danger} />
          <AppText variant="caption" className="font-semibold text-danger">
            Delete
          </AppText>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}
