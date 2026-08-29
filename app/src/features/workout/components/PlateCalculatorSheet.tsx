import { View } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BAR_WEIGHTS, PLATES, calcPlateLoad, type PlateUnit } from '@/lib/plates';

interface PlateCalculatorSheetProps {
  visible: boolean;
  onClose: () => void;
  unit: PlateUnit;
  onUnitChange: (unit: PlateUnit) => void;
  barWeight: number;
  onBarWeightChange: (weight: number) => void;
  target: number;
  onTargetChange: (weight: number) => void;
}

/** Per-side plate math for barbell lifts. */
export function PlateCalculatorSheet({
  visible,
  onClose,
  unit,
  onUnitChange,
  barWeight,
  onBarWeightChange,
  target,
  onTargetChange,
}: PlateCalculatorSheetProps) {
  const result = calcPlateLoad(target, barWeight, PLATES[unit]);
  // Loaded per side; jumping by one plate on each side moves the total by 2x.
  const step = Math.min(...PLATES[unit]) * 2;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Plate calculator">
      <View className="gap-4">
        <SegmentedControl
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          value={unit}
          onChange={onUnitChange}
        />

        <View className="gap-1.5">
          <AppText variant="label">Bar</AppText>
          <SegmentedControl
            options={BAR_WEIGHTS[unit].map((w) => ({ value: String(w), label: `${w} ${unit}` }))}
            value={String(barWeight)}
            onChange={(v) => onBarWeightChange(Number(v))}
          />
        </View>

        <View className="items-center gap-1">
          <AppText variant="label">Target</AppText>
          <NumberStepper
            value={target}
            onChange={onTargetChange}
            step={step}
            max={1000}
            format={(v) => `${v} ${unit}`}
            accessibilityLabel="Target weight"
          />
        </View>

        <View className="gap-2 rounded-2xl bg-surface-muted p-3">
          <AppText variant="label">Per side</AppText>
          {result.perSide.length > 0 ? (
            <View className="flex-row flex-wrap items-center gap-1.5">
              {result.perSide.map((plate, i) => (
                <View key={i} className="flex-row items-center gap-1.5">
                  {i > 0 ? (
                    <AppText variant="caption" className="text-content-faint">
                      +
                    </AppText>
                  ) : null}
                  <Badge label={`${plate}`} />
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption">Bar only</AppText>
          )}
          {result.diff !== 0 ? (
            <AppText variant="caption" className="text-warning">
              {target} {unit} can&apos;t be loaded exactly with these plates — closest is{' '}
              {result.loadedTotal} {unit}.
            </AppText>
          ) : (
            <AppText variant="caption">
              Loads exactly at {result.loadedTotal} {unit}.
            </AppText>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}
