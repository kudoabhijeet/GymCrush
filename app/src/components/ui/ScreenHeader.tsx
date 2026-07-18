import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  /** Right-side actions (IconButtons). */
  actions?: ReactNode;
  /** Hide the back button (e.g. modal roots with their own close). */
  noBack?: boolean;
}

/** Header for stack screens: back chevron, centered-weight title, actions. */
export function ScreenHeader({ title, actions, noBack }: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      {!noBack ? (
        <IconButton
          icon={<ChevronLeft size={22} color={colors.content} />}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        />
      ) : null}
      <AppText variant="heading" className="flex-1" numberOfLines={1}>
        {title}
      </AppText>
      {actions ? <View className="flex-row gap-2">{actions}</View> : null}
    </View>
  );
}
