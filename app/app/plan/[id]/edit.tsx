import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePlan } from '@/features/plans/hooks';
import { PlanEditorForm } from '@/features/plans/PlanEditorForm';

export default function EditPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan, isLoading } = usePlan(id);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Edit plan" />
      {isLoading || !plan ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      ) : (
        <PlanEditorForm plan={plan} />
      )}
    </SafeAreaView>
  );
}
