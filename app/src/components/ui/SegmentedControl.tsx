import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

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
    transform: [{ translateX: withSpring(index * segmentWidth, { damping: 20, stiffness: 250 }) }],
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
          className="absolute bottom-1 left-1 top-1 rounded-lg bg-surface-elevated"
          style={indicatorStyle}
        />
      ) : null}
      {options.map((option) => (
        <Pressable
          key={option.value}
          className="flex-1 items-center justify-center"
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === value }}
        >
          <Text
            className={`font-semibold text-[13px] ${
              option.value === value ? 'text-content' : 'text-content-muted'
            }`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
