import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { haptics, PR_TICK_DELAY_MS } from './haptics';

const impact = vi.mocked(Haptics.impactAsync);
const notification = vi.mocked(Haptics.notificationAsync);
const selection = vi.mocked(Haptics.selectionAsync);

describe('haptics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps each semantic to its native feedback type', () => {
    haptics.tap();
    expect(impact).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Light);

    haptics.setComplete();
    expect(impact).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Medium);

    haptics.selection();
    expect(selection).toHaveBeenCalledTimes(1);

    haptics.restDone();
    expect(notification).toHaveBeenLastCalledWith(Haptics.NotificationFeedbackType.Success);

    haptics.success();
    expect(notification).toHaveBeenLastCalledWith(Haptics.NotificationFeedbackType.Success);

    haptics.warning();
    expect(notification).toHaveBeenLastCalledWith(Haptics.NotificationFeedbackType.Warning);

    haptics.destructive();
    expect(notification).toHaveBeenLastCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  describe('pr()', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('fires Heavy immediately and the Medium tick after the delay', () => {
      haptics.pr();
      expect(impact).toHaveBeenCalledTimes(1);
      expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);

      vi.advanceTimersByTime(PR_TICK_DELAY_MS - 1);
      expect(impact).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(impact).toHaveBeenCalledTimes(2);
      expect(impact).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });
  });

  describe('on web', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
      (Platform as { OS: string }).OS = 'web';
    });
    afterEach(() => {
      (Platform as { OS: string }).OS = originalOS;
    });

    it('every semantic is a no-op', () => {
      haptics.tap();
      haptics.selection();
      haptics.setComplete();
      haptics.restDone();
      haptics.pr();
      haptics.success();
      haptics.warning();
      haptics.destructive();

      expect(impact).not.toHaveBeenCalled();
      expect(notification).not.toHaveBeenCalled();
      expect(selection).not.toHaveBeenCalled();
    });
  });
});
