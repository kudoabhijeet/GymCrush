import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort catch for render-phase crashes — a themed fallback beats a
 * white screen. "Try again" re-renders the tree; persisted stores (auth,
 * active session) survive, so recovery usually lands back where the user was.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center gap-3 bg-surface px-8">
          <AppText variant="display" color="text-brand-text">
            GymCrush
          </AppText>
          <AppText variant="heading">Something went wrong</AppText>
          <AppText variant="caption" className="text-center">
            The app hit an unexpected error. Your data is safe.
          </AppText>
          <View className="pt-2">
            <Button label="Try again" onPress={() => this.setState({ hasError: false })} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}
