import { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Flame, Plus, StickyNote, Trash2, Weight, X } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { useThemeColors } from '@/lib/theme';
import { formatPrescription, weightUnitLabel } from '@/lib/format';
import { BAR_WEIGHTS, type PlateUnit } from '@/lib/plates';
import { toast } from '@/lib/toastStore';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useProfileStore } from '@/features/profile/profileStore';
import { useActiveSessionStore, type ActiveExercise } from '../activeSessionStore';
import type { SetFocusFlow } from '../useSetFocusFlow';
import { PlateCalculatorSheet } from './PlateCalculatorSheet';
import { SetRow } from './SetRow';

/** Most recent set with a known weight — own value, else its ghosted previous. */
function lastKnownWeight(exercise: ActiveExercise): number | null {
  for (let i = exercise.sets.length - 1; i >= 0; i--) {
    const w = exercise.sets[i].weight ?? exercise.sets[i].prev?.weight;
    if (w != null) return w;
  }
  return null;
}

interface ExerciseCardProps {
  exercise: ActiveExercise;
  prSetIds: Set<string>;
  celebrateSetId: string | null;
  flow: SetFocusFlow;
}

/**
 * One exercise's card in the logger. Memoized so edits to other exercises
 * (and the rest-timer tick, which no longer lives in the screen root at all)
 * don't re-render it — the store preserves untouched exercises' references.
 */
export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  prSetIds,
  celebrateSetId,
  flow,
}: ExerciseCardProps) {
  const colors = useThemeColors();
  const defaultUnits = useProfileStore((s) => s.units);
  const info = exerciseLookup(exercise.exerciseId);
  const isBarbell = info?.equipment === 'barbell';
  const rx = exercise.prescription;

  const [plateSheetOpen, setPlateSheetOpen] = useState(false);
  const [plateUnit, setPlateUnit] = useState<PlateUnit>(defaultUnits);
  const [plateBarWeight, setPlateBarWeight] = useState<number>(BAR_WEIGHTS[defaultUnits][0]);
  const [plateTarget, setPlateTarget] = useState<number>(BAR_WEIGHTS[defaultUnits][0]);
  const [notesExpanded, setNotesExpanded] = useState(false);
  // Lifted here (rather than per-row) so a workout with many sets mounts one
  // action sheet per exercise, not one per set.
  const [actionsSetId, setActionsSetId] = useState<string | null>(null);
  const actionsSet = exercise.sets.find((s) => s.id === actionsSetId) ?? null;
  const canDeleteSets = exercise.sets.length > 1;

  const onOpenPlates = () => {
    setPlateTarget(lastKnownWeight(exercise) ?? plateBarWeight);
    setPlateSheetOpen(true);
  };

  const onPlateUnitChange = (next: PlateUnit) => {
    setPlateUnit(next);
    setPlateBarWeight(BAR_WEIGHTS[next][0]);
  };

  // Id-based and dependent only on the stable exercise.id, so the callbacks
  // passed to memoized SetRows never change identity.
  const onToggleWarmup = useCallback(
    (setId: string, isWarmup: boolean) => {
      useActiveSessionStore.getState().updateSet(exercise.id, setId, { isWarmup: !isWarmup });
    },
    [exercise.id],
  );
  const onDeleteSet = useCallback(
    (setId: string) => {
      useActiveSessionStore.getState().removeSet(exercise.id, setId);
      setActionsSetId((cur) => (cur === setId ? null : cur));
    },
    [exercise.id],
  );
  const onOpenActions = useCallback((setId: string) => setActionsSetId(setId), []);

  const onRemoveExercise = () => {
    const store = useActiveSessionStore.getState();
    const session = store.session;
    if (!session) return;
    const index = session.exercises.findIndex((e) => e.id === exercise.id);
    const snapshot = session.exercises[index];
    if (!snapshot) return;
    const hasData = snapshot.sets.some((s) => s.completed || s.weight != null || s.reps != null);
    store.removeExercise(exercise.id);
    // Mid-workout speed beats a confirm sheet: remove instantly, offer undo
    // when logged work was on the card. Empty cards go silently.
    if (hasData) {
      toast.undo(`Removed ${info?.name ?? 'exercise'}`, () => {
        useActiveSessionStore.getState().restoreExercise(snapshot, index);
      });
    }
  };

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalCount = exercise.sets.length;
  const subtitle = [
    rx ? formatPrescription(rx.targetSets, rx.targetReps, rx.targetRpe) : null,
    `${completedCount} of ${totalCount} set${totalCount === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  // Latest-completed drives which row gets the full interactive RPE picker —
  // earlier ones collapse to a static badge so completing sets in order
  // doesn't keep shoving the next row down as the thumb travels toward it.
  let lastCompletedSetId: string | null = null;
  for (let i = exercise.sets.length - 1; i >= 0; i--) {
    if (exercise.sets[i].completed) {
      lastCompletedSetId = exercise.sets[i].id;
      break;
    }
  }

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-0.5 pr-2">
          <AppText variant="subheading" numberOfLines={1}>
            {info?.name ?? 'Exercise'}
          </AppText>
          <AppText variant="caption" className="text-content-faint" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1">
          {isBarbell ? (
            <IconButton
              icon={<Weight size={16} color={colors.contentMuted} />}
              onPress={onOpenPlates}
              variant="plain"
              accessibilityLabel="Plate calculator"
            />
          ) : null}
          <PressableScale
            onPress={onRemoveExercise}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove exercise"
            className="h-10 w-10 items-center justify-center"
          >
            <X size={16} color={colors.contentFaint} />
          </PressableScale>
        </View>
      </View>

      {rx?.notes ? (
        <PressableScale
          onPress={() => setNotesExpanded((v) => !v)}
          accessibilityLabel={notesExpanded ? 'Collapse plan notes' : 'Expand plan notes'}
          className="flex-row items-start gap-1.5 rounded-lg bg-surface-muted/50 px-2.5 py-2"
        >
          <StickyNote size={12} color={colors.contentFaint} style={{ marginTop: 2 }} />
          <AppText
            variant="caption"
            className="flex-1 text-content-faint"
            numberOfLines={notesExpanded ? undefined : 2}
          >
            {rx.notes}
          </AppText>
        </PressableScale>
      ) : null}

      {/* Column headers */}
      <View className="flex-row items-center gap-2 px-1">
        <AppText variant="label" className="w-8">
          Set
        </AppText>
        <AppText variant="label" className="flex-1 text-center">
          Prev
        </AppText>
        <AppText variant="label" className="w-16 text-center">
          {weightUnitLabel(defaultUnits)}
        </AppText>
        <AppText variant="label" className="w-14 text-center">
          Reps
        </AppText>
        <View className="w-11" />
      </View>

      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          exerciseId={exercise.id}
          set={set}
          isPr={set.completed && prSetIds.has(set.id)}
          celebrate={celebrateSetId === set.id}
          prescription={rx}
          isLatestCompleted={set.id === lastCompletedSetId}
          canDelete={canDeleteSets}
          onToggleWarmup={onToggleWarmup}
          onDelete={onDeleteSet}
          onOpenActions={onOpenActions}
          flow={flow}
        />
      ))}

      <PressableScale
        onPress={() => useActiveSessionStore.getState().addSet(exercise.id)}
        accessibilityRole="button"
        accessibilityLabel="Add set"
        className="flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface-muted py-2.5"
      >
        <Plus size={14} color={colors.contentMuted} />
        <AppText variant="caption" className="font-semibold">
          Add set
        </AppText>
      </PressableScale>

      {isBarbell ? (
        <PlateCalculatorSheet
          visible={plateSheetOpen}
          onClose={() => setPlateSheetOpen(false)}
          unit={plateUnit}
          onUnitChange={onPlateUnitChange}
          barWeight={plateBarWeight}
          onBarWeightChange={setPlateBarWeight}
          target={plateTarget}
          onTargetChange={setPlateTarget}
        />
      ) : null}

      <BottomSheet
        visible={actionsSet !== null}
        onClose={() => setActionsSetId(null)}
        title={actionsSet ? `Set ${actionsSet.setNumber}` : undefined}
      >
        {actionsSet ? (
          <View className="gap-3">
            <Button
              label={actionsSet.isWarmup ? 'Unmark warmup' : 'Mark as warmup'}
              variant="secondary"
              icon={<Flame size={16} color={colors.accent} />}
              onPress={() => {
                setActionsSetId(null);
                onToggleWarmup(actionsSet.id, actionsSet.isWarmup);
              }}
            />
            {canDeleteSets ? (
              <Button
                label="Delete set"
                variant="danger"
                icon={<Trash2 size={16} color={colors.danger} />}
                onPress={() => {
                  setActionsSetId(null);
                  onDeleteSet(actionsSet.id);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </Card>
  );
});
