import { useEffect, useState } from 'react';
import { Linking, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlarmClock, Bell, BellOff } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useThemeColors } from '@/lib/theme';
import { hasNotificationPermission, requestNotificationPermission } from '@/lib/notifications';
import { useNotificationStore } from '@/features/profile/notificationStore';

const PRESETS: { hour: number; minute: number; label: string }[] = [
  { hour: 6, minute: 0, label: '6:00 AM' },
  { hour: 7, minute: 0, label: '7:00 AM' },
  { hour: 12, minute: 0, label: '12:00 PM' },
  { hour: 18, minute: 0, label: '6:00 PM' },
  { hour: 20, minute: 0, label: '8:00 PM' },
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const restTimer = useNotificationStore((s) => s.restTimer);
  const setRestTimer = useNotificationStore((s) => s.setRestTimer);
  const dailyReminder = useNotificationStore((s) => s.dailyReminder);
  const setDailyReminder = useNotificationStore((s) => s.setDailyReminder);
  const reminderHour = useNotificationStore((s) => s.reminderHour);
  const reminderMinute = useNotificationStore((s) => s.reminderMinute);
  const setReminderTime = useNotificationStore((s) => s.setReminderTime);

  // null while the initial check is in flight — avoids flashing the blocked
  // banner for a frame before we actually know the permission state.
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [requesting, setRequesting] = useState<'rest' | 'daily' | null>(null);

  useEffect(() => {
    let mounted = true;
    // The user may have revoked permission in Settings since either toggle
    // was turned on — re-check on mount so the blocked state stays honest.
    hasNotificationPermission().then((granted) => {
      if (mounted) setPermissionGranted(granted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // A toggle that was refused permission. Tracked separately because a refused
  // toggle never turns on, so the stored prefs alone can't reveal the very
  // case the banner exists for: permission already denied, nothing enabled.
  const [refused, setRefused] = useState(false);

  const blocked = permissionGranted === false && (restTimer || dailyReminder || refused);

  const toggle = async (kind: 'rest' | 'daily', next: boolean) => {
    const setter = kind === 'rest' ? setRestTimer : setDailyReminder;
    // Turning off never prompts — only requesting permission on the way in.
    if (!next) {
      setter(false);
      return;
    }
    setRequesting(kind);
    const granted = await requestNotificationPermission();
    setRequesting(null);
    setPermissionGranted(granted);
    setRefused(!granted);
    if (granted) setter(true);
  };

  const switchProps = {
    trackColor: { false: colors.surfaceMuted, true: colors.brand },
    ios_backgroundColor: colors.surfaceMuted,
    thumbColor: colors.surfaceElevated,
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-16 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {blocked ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)}>
            <Card className="gap-3 border-warning/30 bg-warning/10">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-warning/20">
                  <BellOff size={18} color={colors.warning} />
                </View>
                <AppText variant="subheading" className="flex-1">
                  Notifications are blocked
                </AppText>
              </View>
              <AppText variant="caption">
                GymCrush doesn&apos;t have permission to send notifications, so nothing here can
                be turned on until it&apos;s enabled in system settings.
              </AppText>
              <Button
                label="Open Settings"
                size="sm"
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            </Card>
          </Animated.View>
        ) : null}

        <View className="gap-2">
          <AppText variant="label">Workout</AppText>
          <ListGroup>
            <ListRow
              title="Rest timer alerts"
              subtitle="Alert me when a rest period ends. Only matters in the background — the on-screen timer and haptic already cover it while GymCrush is open."
              left={
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                  <Bell size={18} color={colors.contentMuted} />
                </View>
              }
              right={
                <Switch
                  value={restTimer}
                  onValueChange={(v) => toggle('rest', v)}
                  disabled={requesting !== null}
                  accessibilityLabel="Rest timer alerts"
                  {...switchProps}
                />
              }
            />
            <ListSeparator />
            <ListRow
              title="Daily reminder"
              subtitle="A nudge to train, once a day."
              left={
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                  <AlarmClock size={18} color={colors.contentMuted} />
                </View>
              }
              right={
                <Switch
                  value={dailyReminder}
                  onValueChange={(v) => toggle('daily', v)}
                  disabled={requesting !== null}
                  accessibilityLabel="Daily reminder"
                  {...switchProps}
                />
              }
            />
          </ListGroup>
        </View>

        {dailyReminder ? (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <Card className="gap-4">
              <View className="items-center gap-1">
                <AppText variant="label">Reminder time</AppText>
                <AppText variant="title">{formatTime(reminderHour, reminderMinute)}</AppText>
              </View>

              <View className="flex-row flex-wrap justify-center gap-2">
                {PRESETS.map((p) => (
                  <Chip
                    key={p.label}
                    label={p.label}
                    selected={reminderHour === p.hour && reminderMinute === p.minute}
                    onPress={() => setReminderTime(p.hour, p.minute)}
                  />
                ))}
              </View>

              <View className="flex-row items-center justify-center gap-8 pt-1">
                <View className="items-center gap-2">
                  <AppText variant="caption">Hour</AppText>
                  <NumberStepper
                    value={reminderHour}
                    onChange={(next) => setReminderTime(next, reminderMinute)}
                    min={0}
                    max={23}
                    wrap
                    format={formatHour}
                  />
                </View>
                <View className="items-center gap-2">
                  <AppText variant="caption">Minute</AppText>
                  <NumberStepper
                    value={reminderMinute}
                    onChange={(next) => setReminderTime(reminderHour, next)}
                    step={5}
                    min={0}
                    max={59}
                    wrap
                    format={(v) => String(v).padStart(2, '0')}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
