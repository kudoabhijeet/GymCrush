import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { kvStorage } from '@/lib/storage';
import {
  cancelDailyReminder,
  cancelRestNotification,
  scheduleDailyReminder,
} from '@/lib/notifications';

interface NotificationState {
  /** Post a notification when the rest timer runs out with the app backgrounded. */
  restTimer: boolean;
  dailyReminder: boolean;
  reminderHour: number;
  reminderMinute: number;
  setRestTimer: (enabled: boolean) => void;
  setDailyReminder: (enabled: boolean) => void;
  setReminderTime: (hour: number, minute: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      restTimer: false,
      dailyReminder: false,
      reminderHour: 18,
      reminderMinute: 0,

      setRestTimer: (restTimer) => {
        set({ restTimer });
        // Turning this off mid-rest has to retract the alert already scheduled
        // for the current rest period, not just suppress the next one.
        if (!restTimer) cancelRestNotification();
      },

      setDailyReminder: (dailyReminder) => {
        set({ dailyReminder });
        const { reminderHour, reminderMinute } = get();
        if (dailyReminder) scheduleDailyReminder(reminderHour, reminderMinute);
        else cancelDailyReminder();
      },

      setReminderTime: (reminderHour, reminderMinute) => {
        set({ reminderHour, reminderMinute });
        if (get().dailyReminder) scheduleDailyReminder(reminderHour, reminderMinute);
      },
    }),
    {
      name: 'gc.notifications',
      // SecureStore-backed like the other device prefs, and deliberately not
      // MMKV: that instance is user-scoped and wiped on sign-out, which would
      // reset these. The cost is an async read, so a set completed in the first
      // moments of a cold start can still see the default `restTimer: false`
      // and skip its alert — a narrow miss, preferred over losing the prefs.
      storage: createJSONStorage(() => kvStorage),
      partialize: (state) => ({
        restTimer: state.restTimer,
        dailyReminder: state.dailyReminder,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
      }),
      // The OS keeps the scheduled reminder across restarts, but permission can
      // be revoked in Settings while the app is closed — re-arming on rehydrate
      // keeps the stored toggle and what's actually scheduled in agreement.
      onRehydrateStorage: () => (state) => {
        if (state?.dailyReminder) {
          scheduleDailyReminder(state.reminderHour, state.reminderMinute);
        }
      },
    },
  ),
);
