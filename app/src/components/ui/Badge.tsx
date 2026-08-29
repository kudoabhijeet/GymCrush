import { View } from 'react-native';
import { AppText } from './Text';

type Tone = 'brand' | 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const tones: Record<Tone, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand/15', text: 'text-brand-text' },
  neutral: { bg: 'bg-surface-muted', text: 'text-content-muted' },
  accent: { bg: 'bg-accent/15', text: 'text-accent' },
  success: { bg: 'bg-success/15', text: 'text-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning' },
  danger: { bg: 'bg-danger/15', text: 'text-danger' },
};

/** Small static tag: goal, equipment, PR markers. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const t = tones[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${t.bg}`}>
      <AppText variant="label" color={t.text}>
        {label}
      </AppText>
    </View>
  );
}
