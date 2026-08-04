import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const LAST_UPDATED = '2 August 2026';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Overview',
    body: 'This policy explains what GymCrush collects, why we collect it, and what control you have over it. We only collect what the app needs to work — we do not sell your data.',
  },
  {
    heading: '2. Account information',
    body: 'When you sign up we store your email address and display name so we can identify your account and sign you in. Passwords are never stored by us in readable form; authentication is handled by Supabase Auth, which stores credentials securely on our behalf.',
  },
  {
    heading: '3. Health and fitness data you enter',
    body: 'GymCrush stores the information you choose to log: bodyweight and height, age and activity level, calorie and macro targets, food entries, workout plans, training sessions, and set-by-set exercise logs. This data exists so the app can show your history, progress, and targets back to you.',
  },
  {
    heading: '4. How we use your data',
    body: 'Your data is used to operate the app: to calculate your calorie and macro targets, display your training history and trends, sync your logs across your devices, and keep your account secure. We do not use it for advertising and we do not sell or rent it to third parties.',
  },
  {
    heading: '5. Service providers',
    body: 'We use Supabase for authentication and a hosted database to store your logs and profile. These providers process data on our instructions in order to run the service. Basic technical information such as IP address and request timestamps may be recorded in server logs for security and debugging.',
  },
  {
    heading: '6. Data retention and deletion',
    body: 'We keep your data for as long as your account exists. You can permanently delete your account at any time from Profile → Delete my account. Deleting your account removes your login identity and cascades through your profile, targets, plans, workout sessions, and food and weight logs. This is irreversible, and we cannot restore deleted data. Backups and server logs may retain residual copies for a short period before being overwritten.',
  },
  {
    heading: '7. Your rights',
    body: 'Depending on where you live, you may have the right to access, correct, export, or erase your personal data, and to object to or restrict certain processing. You can edit most of your data directly in the app and delete all of it via account deletion. For any other request, email support@gymcrush.app.',
  },
  {
    heading: '8. Security',
    body: 'Data is transmitted over encrypted connections and access tokens are stored in your device secure storage. No system is perfectly secure, but we take reasonable technical and organisational measures to protect your information.',
  },
  {
    heading: "9. Children's privacy",
    body: 'GymCrush is not directed at children and is not intended for use by anyone under the age required to consent to data processing in their country. If you believe a child has created an account, contact us and we will delete it.',
  },
  {
    heading: '10. Changes to this policy',
    body: 'If this policy changes, we will update the date at the top of this page and, where the change is significant, notify you in the app.',
  },
  {
    heading: '11. Contact',
    body: 'Questions or privacy requests? Email support@gymcrush.app.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Privacy Policy" />
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-16 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption">Last updated {LAST_UPDATED}</AppText>

        {SECTIONS.map((section) => (
          <View key={section.heading} className="gap-2">
            <AppText variant="subheading">{section.heading}</AppText>
            <AppText variant="body" className="text-content-muted">
              {section.body}
            </AppText>
          </View>
        ))}

        <AppText variant="caption">
          This is a draft pending legal review and is not legal advice.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
