import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PlanEditorForm } from '@/features/plans/PlanEditorForm';

export default function NewPlanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="New plan" />
      <PlanEditorForm />
    </SafeAreaView>
  );
}
