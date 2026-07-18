import { ComingSoon, ScreenScaffold } from '@/components/ui/ScreenScaffold';

export default function LogScreen() {
  return (
    <ScreenScaffold title="Log" subtitle="The fastest way to record a workout.">
      <ComingSoon
        items={[
          'Start freestyle or plan-based session',
          'Fast set entry: weight / reps / RPE',
          'Quick-repeat previous set + rest timer',
          'Session summary and per-exercise history',
        ]}
      />
    </ScreenScaffold>
  );
}
