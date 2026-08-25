import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BRAND } from './theme';

const REST_CHANNEL = 'rest-timer';
const REMINDER_CHANNEL = 'workout-reminder';

/**
 * Rest-done delivered while the logger is open is redundant — the on-screen
 * timer and the rest-done haptic already fired. Only the reminder, which is
 * meant to pull the user back in, is worth a banner in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isReminder = notification.request.content.data?.kind === 'reminder';
    return {
      shouldShowBanner: isReminder,
      shouldShowList: isReminder,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
    name: 'Rest timer',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: BRAND,
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Workout reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND,
  });
}

/** Returns whether we're allowed to post notifications, prompting at most once. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted' && existing.canAskAgain) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status === 'granted') await ensureChannels();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).status === 'granted';
}

/* -------------------------------- Rest timer ------------------------------ */

/**
 * There is only ever one rest notification, so it uses a fixed id rather than
 * the one `scheduleNotificationAsync` hands back: an id held in memory is lost
 * when the process is killed, which would leave a scheduled "Rest complete"
 * that nothing can cancel — it would fire long after the workout was saved.
 */
const REST_IDENTIFIER = 'gc.rest-timer';

/**
 * Bumped by every schedule and cancel. Scheduling awaits the permission check
 * and the native call, and a skip landing in that window would otherwise be
 * overtaken by the notification it was meant to prevent.
 */
let restGeneration = 0;

export async function cancelRestNotification() {
  restGeneration++;
  await Notifications.cancelScheduledNotificationAsync(REST_IDENTIFIER);
}

export async function scheduleRestNotification(seconds: number) {
  const generation = ++restGeneration;
  // A trigger under a second fires immediately on iOS rather than not at all.
  if (seconds < 1) return;
  if (!(await hasNotificationPermission())) return;
  await ensureChannels();
  if (generation !== restGeneration) return;

  await Notifications.scheduleNotificationAsync({
    identifier: REST_IDENTIFIER,
    content: {
      title: 'Rest complete',
      body: 'Next set is ready.',
      data: { kind: 'rest' },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: REST_CHANNEL } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });

  // A cancel that landed while the native call was in flight saw nothing to
  // remove, so undo it here.
  if (generation !== restGeneration) {
    await Notifications.cancelScheduledNotificationAsync(REST_IDENTIFIER);
  }
}

/* ----------------------------- Daily reminder ----------------------------- */

const REMINDER_IDENTIFIER = 'gc.workout-reminder';

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await cancelDailyReminder();
  if (!(await hasNotificationPermission())) return;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: 'Time to train',
      body: "Keep the streak alive — today's workout is waiting.",
      data: { kind: 'reminder' },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
