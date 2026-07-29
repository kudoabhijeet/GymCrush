import { useState } from 'react';
import { View } from 'react-native';
import { colorScheme } from 'nativewind';
import {
  Bell,
  ChevronRight,
  Flame,
  LogOut,
  Ruler,
  Scale,
  Target,
  UserRound,
} from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatWeight } from '@/lib/format';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfileStore } from '@/features/profile/profileStore';

type ThemeChoice = 'system' | 'light' | 'dark';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { bodyProfile, macroTarget, units, setUnits, resetOnboarding } = useProfileStore();
  const [theme, setTheme] = useState<ThemeChoice>('system');

  const changeTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    colorScheme.set(choice);
  };

  const initials =
    user?.displayName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  return (
    <ScreenScaffold title="Profile">
      {/* User card */}
      <Card className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <AppText className="font-extrabold text-lg text-brand-fg">{initials}</AppText>
        </View>
        <View className="flex-1 gap-0.5">
          <AppText variant="heading">{user?.displayName ?? 'Athlete'}</AppText>
          <AppText variant="caption">{user?.email}</AppText>
        </View>
      </Card>

      {/* Body stats */}
      <View className="flex-row gap-3">
        <StatTile
          label="Weight"
          value={formatWeight(bodyProfile?.weightKg ?? null, units)}
          unit={units}
          icon={<Scale size={13} color={colors.contentFaint} />}
        />
        <StatTile
          label="Height"
          value={bodyProfile ? `${bodyProfile.heightCm}` : '—'}
          unit="cm"
          icon={<Ruler size={13} color={colors.contentFaint} />}
        />
        <StatTile
          label="Calories"
          value={macroTarget ? `${macroTarget.calories}` : '—'}
          unit="kcal"
          icon={<Flame size={13} color={colors.contentFaint} />}
        />
      </View>

      {/* Targets */}
      <View className="gap-2">
        <AppText variant="label">Nutrition</AppText>
        <ListGroup>
          <ListRow
            title="Macro targets"
            subtitle={
              macroTarget
                ? `${macroTarget.proteinG}g protein · ${macroTarget.carbsG}g carbs · ${macroTarget.fatG}g fat`
                : 'Run the setup to compute targets'
            }
            left={
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand/15">
                <Target size={18} color={colors.brandText} />
              </View>
            }
            onPress={resetOnboarding}
          />
        </ListGroup>
      </View>

      {/* Preferences */}
      <View className="gap-2">
        <AppText variant="label">Preferences</AppText>
        <Card className="gap-4">
          <View className="gap-2">
            <AppText variant="caption">Units</AppText>
            <SegmentedControl
              options={[
                { value: 'kg', label: 'Kilograms' },
                { value: 'lb', label: 'Pounds' },
              ]}
              value={units}
              onChange={setUnits}
            />
          </View>
          <View className="gap-2">
            <AppText variant="caption">Appearance</AppText>
            <SegmentedControl
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={theme}
              onChange={changeTheme}
            />
          </View>
        </Card>
      </View>

      {/* Misc */}
      <ListGroup>
        <ListRow
          title="Notifications"
          subtitle="Rest reminders, streaks — coming soon"
          left={
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
              <Bell size={18} color={colors.contentMuted} />
            </View>
          }
          right={<ChevronRight size={18} color={colors.contentFaint} />}
        />
        <ListSeparator />
        <ListRow
          title="Edit body profile"
          subtitle="Re-run the target calculator"
          left={
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
              <UserRound size={18} color={colors.contentMuted} />
            </View>
          }
          onPress={resetOnboarding}
        />
        <ListSeparator />
        <ListRow
          title="Log out"
          destructive
          left={
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-danger/10">
              <LogOut size={18} color={colors.danger} />
            </View>
          }
          onPress={logout}
        />
      </ListGroup>

      <AppText variant="caption" className="text-center">
        GymCrush v0.1.1
      </AppText>
    </ScreenScaffold>
  );
}
