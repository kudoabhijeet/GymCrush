import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { pressScale } from '@/lib/motion';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';
import { Card } from './Card';
import { PressableScale } from './PressableScale';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading slot — usually a lucide icon in a tinted square. */
  left?: ReactNode;
  /** Trailing slot — value text, badge, switch… Defaults to a chevron when pressable. */
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

export function ListRow({ title, subtitle, left, right, onPress, destructive }: ListRowProps) {
  const colors = useThemeColors();

  const content = (
    <>
      {left ? <View className="mr-3">{left}</View> : null}
      <View className="flex-1 gap-0.5">
        <AppText
          variant="body"
          className="font-semibold"
          color={destructive ? 'text-danger' : 'text-content'}
        >
          {title}
        </AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.contentFaint} /> : null)}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={pressScale.card}
        accessibilityRole="button"
        className="flex-row items-center px-4 py-3.5"
      >
        {content}
      </PressableScale>
    );
  }
  return <View className="flex-row items-center px-4 py-3.5">{content}</View>;
}

/** Groups ListRows in an elevated card with hairline separators. */
export function ListGroup({ children }: { children: ReactNode }) {
  return <Card className="overflow-hidden p-0">{children}</Card>;
}

export function ListSeparator() {
  return <View className="ml-4 h-px bg-surface-muted" />;
}
