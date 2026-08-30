import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  Bell,
  ChevronRight,
  FileText,
  Flame,
  LifeBuoy,
  LogOut,
  Ruler,
  Scale,
  Shield,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { toast } from '@/lib/toastStore';
import { formatWeight } from '@/lib/format';
import { useAuthStore } from '@/features/auth/authStore';
import { useOnboardingStore } from '@/features/profile/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { bodyProfile, macroTarget, units, setUnits, theme, setTheme } = useProfileStore();
  const [deleting, setDeleting] = useState(false);
  const { confirm, element: confirmElement } = useConfirmSheet();

  const openTargetCalculator = () => {
    const { hydrateFromProfile, reset } = useOnboardingStore.getState();
    if (bodyProfile) hydrateFromProfile(bodyProfile);
    else reset();
    router.push('/(onboarding)/goal');
  };

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: "You'll need to sign in again to see your data.",
      confirmLabel: 'Log out',
    });
    if (ok) logout();
  };

  const confirmDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account?',
      message:
        'This permanently deletes your account and everything in it — plans, workouts, food and weight logs. This cannot be undone.',
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      setDeleting(false);
      toast.show({ message: "Couldn't delete your account — try again.", tone: 'warning' });
    }
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
            onPress={openTargetCalculator}
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
              onChange={setTheme}
            />
          </View>
        </Card>
      </View>

      {/* Misc */}
      <ListGroup>
        <ListRow
          title="Notifications"
          subtitle="Rest timer alerts and daily reminders"
          left={
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
              <Bell size={18} color={colors.contentMuted} />
            </View>
          }
          right={<ChevronRight size={18} color={colors.contentFaint} />}
          onPress={() => router.push('/notifications')}
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
          onPress={openTargetCalculator}
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
          onPress={() => void onLogout()}
        />
      </ListGroup>

      {/* Support & legal */}
      <View className="gap-2">
        <AppText variant="label">Support & legal</AppText>
        <ListGroup>
          <ListRow
            title="Report a problem"
            subtitle="Something broken or confusing?"
            left={
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                <LifeBuoy size={18} color={colors.contentMuted} />
              </View>
            }
            onPress={() => router.push('/report-problem')}
          />
          <ListSeparator />
          <ListRow
            title="Terms & Conditions"
            left={
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                <FileText size={18} color={colors.contentMuted} />
              </View>
            }
            onPress={() => router.push('/legal/terms')}
          />
          <ListSeparator />
          <ListRow
            title="Privacy Policy"
            left={
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                <Shield size={18} color={colors.contentMuted} />
              </View>
            }
            onPress={() => router.push('/legal/privacy')}
          />
          <ListSeparator />
          <ListRow
            title={deleting ? 'Deleting account…' : 'Delete my account'}
            subtitle="Permanently erases your account and data"
            destructive
            left={
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-danger/10">
                <Trash2 size={18} color={colors.danger} />
              </View>
            }
            onPress={deleting ? undefined : () => void confirmDeleteAccount()}
          />
        </ListGroup>
      </View>

      <AppText variant="caption" className="text-center">
        GymCrush v{Constants.expoConfig?.version ?? '—'}
      </AppText>

      {confirmElement}
    </ScreenScaffold>
  );
}
