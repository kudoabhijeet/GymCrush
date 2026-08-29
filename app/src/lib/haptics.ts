import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Semantic haptic vocabulary — the only place that calls expo-haptics.
 * Distinct feedback types carry distinct meanings (set-complete vs rest-done
 * vs PR must feel different), so call the semantic that matches the moment
 * rather than reaching for an impact style directly. Restraint is part of the
 * design: high-frequency chrome (tab switches, scrolling) stays silent so the
 * meaningful taps keep their meaning.
 *
 * Every function is fire-and-forget and a no-op on web.
 */

/** Gap between the PR "thud" and its trailing "tick". */
export const PR_TICK_DELAY_MS = 90;

const native = () => Platform.OS !== 'web';

export const haptics = {
  /** Minor acknowledgment — starting a workout, tapping an undo action. */
  tap() {
    if (native()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Picking among options — segmented controls, chips, switches, copy-prev. */
  selection() {
    if (native()) void Haptics.selectionAsync();
  },

  /** A set checked off — the core logging beat. */
  setComplete() {
    if (native()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Rest countdown hit zero (never fired on Skip). */
  restDone() {
    if (native()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * New PR: Heavy + a trailing Medium reads as a distinct little "thud-tick",
   * set apart from the plain Medium (set-complete) and Success (rest-done).
   */
  pr() {
    if (!native()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), PR_TICK_DELAY_MS);
  },

  /** Something saved — workout finished, plan saved. */
  success() {
    if (native()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Attention before proceeding — finish-guard sheet, validation block. */
  warning() {
    if (native()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** A destructive action was confirmed — delete plan, discard workout. */
  destructive() {
    if (native()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
