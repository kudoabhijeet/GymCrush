import { useMemo } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { WorkoutSession } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { localDateKey, startOfLocalDay } from '@/lib/format';
import { useThemeColors } from '@/lib/theme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const MS_DAY = 86_400_000;

/** Monday 00:00 local for the week containing `ref`, shifted by `weekOffset`. */
export function weekStartMs(ref: number, weekOffset: number): number {
  const d = new Date(startOfLocalDay(ref));
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset + weekOffset * 7);
  return d.getTime();
}

interface WeekStripProps {
  sessions: WorkoutSession[];
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  selectedKey: string | null;
  onSelectDay: (key: string, sessionsOnDay: WorkoutSession[]) => void;
}

/** Mon–Sun strip with trained-day dots; swipe weeks via chevrons. */
export function WeekStrip({
  sessions,
  weekOffset,
  onWeekOffsetChange,
  selectedKey,
  onSelectDay,
}: WeekStripProps) {
  const colors = useThemeColors();
  const todayKey = localDateKey(new Date());

  const { days, label } = useMemo(() => {
    const start = weekStartMs(Date.now(), weekOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start + i * MS_DAY);
      const key = localDateKey(date);
      const onDay = sessions.filter((s) => localDateKey(new Date(s.startedAt)) === key);
      return { key, label: DAY_LABELS[i], date, onDay, isToday: key === todayKey };
    });
    const label =
      weekOffset === 0
        ? 'This week'
        : weekOffset === -1
          ? 'Last week'
          : `${new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    return { days, label };
  }, [sessions, weekOffset, todayKey]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <IconButton
          icon={<ChevronLeft size={18} color={colors.content} />}
          onPress={() => onWeekOffsetChange(weekOffset - 1)}
          accessibilityLabel="Previous week"
          variant="plain"
        />
        <AppText variant="label">{label}</AppText>
        <IconButton
          icon={<ChevronRight size={18} color={weekOffset >= 0 ? colors.contentFaint : colors.content} />}
          onPress={() => weekOffset < 0 && onWeekOffsetChange(weekOffset + 1)}
          accessibilityLabel="Next week"
          variant="plain"
        />
      </View>
      <View className="flex-row justify-between px-1">
        {days.map((day) => {
          const selected = selectedKey === day.key;
          const trained = day.onDay.length > 0;
          return (
            <PressableScale
              key={day.key}
              onPress={() => onSelectDay(day.key, day.onDay)}
              accessibilityRole="button"
              accessibilityLabel={`${day.date.toLocaleDateString(undefined, { weekday: 'long' })}${trained ? ', trained' : ''}`}
              className="items-center gap-1.5"
            >
              <AppText
                variant="caption"
                className={selected || day.isToday ? 'font-bold text-content' : undefined}
              >
                {day.label}
              </AppText>
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  selected
                    ? 'bg-brand'
                    : trained
                      ? 'bg-brand/20'
                      : day.isToday
                        ? 'border border-surface-muted'
                        : ''
                }`}
              >
                <AppText
                  className={`font-bold text-[13px] ${
                    selected ? 'text-brand-fg' : trained ? 'text-brand-text' : 'text-content-muted'
                  }`}
                >
                  {day.date.getDate()}
                </AppText>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
