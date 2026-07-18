import { ComingSoon, ScreenScaffold } from '@/components/ui/ScreenScaffold';

export default function PlansScreen() {
  return (
    <ScreenScaffold title="Plans" subtitle="Create, explore, and follow workout plans.">
      <ComingSoon
        items={[
          'Explore plans by goal (strength, hypertrophy, fat loss…)',
          'Create & edit plans → days → exercises',
          'Duplicate a plan as a starting point',
          'Start a session directly from a plan day',
        ]}
      />
    </ScreenScaffold>
  );
}
