import { useCallback, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { AppText } from './Text';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Extra content between message and buttons (e.g. a list of what's affected). */
  children?: ReactNode;
  confirmLabel: string;
  /** `danger` (default) styles the confirm destructively and fires the destructive haptic. */
  confirmTone?: 'danger' | 'primary';
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Bottom-sheet confirmation — the app's replacement for Alert.alert. */
export function ConfirmSheet({
  visible,
  title,
  message,
  children,
  confirmLabel,
  confirmTone = 'danger',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="gap-3">
        {message ? <AppText variant="body">{message}</AppText> : null}
        {children}
        <Button
          label={confirmLabel}
          variant={confirmTone === 'primary' ? 'primary' : 'danger'}
          onPress={() => {
            if (confirmTone === 'danger') haptics.destructive();
            onConfirm();
          }}
        />
        <Button label={cancelLabel} variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  confirmTone?: 'danger' | 'primary';
  cancelLabel?: string;
}

/**
 * Promise-based confirmation:
 *
 *   const { confirm, element } = useConfirmSheet();
 *   …
 *   if (await confirm({ title: 'Delete plan?', confirmLabel: 'Delete' })) { … }
 *
 * Render `{element}` once at the bottom of the screen. Dismissing the sheet
 * (backdrop, drag, cancel) resolves `false`.
 *
 * Do NOT call this while another modal is closing — RN dismissal is async on
 * iOS, and a modal presented in the same commit as another's dismissal can
 * silently never appear. Confirm inside that sheet instead (see the two-step
 * options sheet in `app/plan/[id]/index.tsx`).
 */
export function useConfirmSheet() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      // A second confirm while one is open cancels the first.
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setOpts(options);
      setOpen(true);
    });
  }, []);

  // `opts` outlives `open` so the sheet doesn't blank while closing.
  const element = opts ? (
    <ConfirmSheet
      visible={open}
      title={opts.title}
      message={opts.message}
      confirmLabel={opts.confirmLabel}
      confirmTone={opts.confirmTone}
      cancelLabel={opts.cancelLabel}
      onConfirm={() => settle(true)}
      onClose={() => settle(false)}
    />
  ) : null;

  return { confirm, element };
}
