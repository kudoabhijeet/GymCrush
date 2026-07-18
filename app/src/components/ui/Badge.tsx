import { Text, View } from 'react-native';

type Tone = 'brand' | 'neutral' | 'accent' | 'success' | 'danger';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const tones: Record<Tone, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand/15', text: 'text-brand-text' },
  neutral: { bg: 'bg-surface-muted', text: 'text-content-muted' },
  accent: { bg: 'bg-accent/15', text: 'text-accent' },
  success: { bg: 'bg-success/15', text: 'text-success' },
  danger: { bg: 'bg-danger/15', text: 'text-danger' },
};

/** Small static tag: goal, equipment, PR markers. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const t = tones[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${t.bg}`}>
      <Text className={`font-semibold text-[11px] uppercase tracking-wide ${t.text}`}>{label}</Text>
    </View>
  );
}
