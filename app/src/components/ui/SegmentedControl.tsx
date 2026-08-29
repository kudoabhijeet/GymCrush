import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { pressScale, springs } from '@/lib/motion';
import { AppText } from './Text';
import { PressableScale } from './PressableScale';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Two-to-four segment switch with a sliding indicator. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  // Container has p-1 (4px each side); segments split the inner width.
  const segmentWidth = width > 0 ? (width - 8) / options.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(index * segmentWidth, springs.snappy) }],
    width: segmentWidth,
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      className="h-11 flex-row overflow-hidden rounded-xl bg-surface-muted p-1"
      onLayout={onLayout}
    >
      {width > 0 ? (
        <Animated.View
          // 12px = the container's 16px radius minus its 4px padding, so the
          // indicator's corners run concentric with the container's.
          className="absolute bottom-1 left-1 top-1 rounded-[12px] bg-surface-elevated"
          style={indicatorStyle}
        />
      ) : null}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            className="flex-1 items-center justify-center"
            scaleTo={pressScale.chip}
            // Segments are 36pt tall inside the padded track — slop to 44pt.
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => {
              if (!isSelected) haptics.selection();
              onChange(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <AppText
              variant="caption"
              className="font-semibold"
              color={isSelected ? 'text-content' : 'text-content-muted'}
            >
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}
