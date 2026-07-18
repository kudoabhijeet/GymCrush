import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/lib/theme';
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
        <Text
          className={`font-semibold text-[15px] ${destructive ? 'text-danger' : 'text-content'}`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-body text-[13px] text-content-muted">{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.contentFaint} /> : null)}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
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
  return (
    <View className="overflow-hidden rounded-2xl border border-surface-muted bg-surface-elevated">
      {children}
    </View>
  );
}

export function ListSeparator() {
  return <View className="ml-4 h-px bg-surface-muted" />;
}
