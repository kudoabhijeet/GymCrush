import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const LAST_UPDATED = '2 August 2026';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Acceptance of terms',
    body: 'By creating a GymCrush account or using the app, you agree to these Terms & Conditions. If you do not agree, please stop using the app and delete your account.',
  },
  {
    heading: '2. What GymCrush is',
    body: 'GymCrush is a fitness and nutrition tracking app. It lets you plan workouts, log training sessions, record bodyweight, and track food and macro targets. Any numbers the app calculates — calorie targets, macro splits, training suggestions — are estimates generated from formulas and the information you enter.',
  },
  {
    heading: '3. Not medical or health advice',
    body: 'GymCrush is not a medical device and does not provide medical, nutritional, or professional health advice. Nothing in the app is a substitute for consulting a qualified doctor, dietitian, or trainer. Talk to a healthcare professional before starting a new training or nutrition programme, especially if you are pregnant, have an injury, or have a medical condition. You exercise and eat at your own risk.',
  },
  {
    heading: '4. Your account',
    body: 'You are responsible for keeping your login credentials secure and for everything that happens under your account. You must provide accurate information when signing up, and you must be old enough to consent to these terms in your country. Tell us straight away if you believe your account has been accessed without your permission.',
  },
  {
    heading: '5. Acceptable use',
    body: 'Use GymCrush lawfully and reasonably. Do not attempt to break, overload, reverse engineer, or gain unauthorised access to the app or its servers, do not scrape or resell its data, and do not use it to store or share unlawful or abusive content.',
  },
  {
    heading: '6. Your content',
    body: 'The workouts, logs, and measurements you enter belong to you. You grant us permission to store and process that data solely to operate the app and provide its features to you, as described in our Privacy Policy.',
  },
  {
    heading: '7. Pricing',
    body: 'GymCrush is currently free to use. If paid plans or in-app purchases are introduced in future, the terms, prices, and renewal conditions will be shown to you before you are asked to pay, and any purchase will be handled by the App Store or Google Play under their own terms.',
  },
  {
    heading: '8. Availability and changes',
    body: 'We may update, change, or discontinue features at any time, and the app may occasionally be unavailable for maintenance or reasons outside our control. We do not guarantee uninterrupted or error-free service.',
  },
  {
    heading: '9. Disclaimers and limitation of liability',
    body: 'GymCrush is provided "as is" and "as available", without warranties of any kind to the fullest extent permitted by law. We are not liable for injury, health outcomes, lost data, or any indirect or consequential loss arising from your use of the app. Nothing here limits liability that cannot legally be limited.',
  },
  {
    heading: '10. Termination',
    body: 'You may stop using GymCrush at any time and delete your account from Profile, which permanently removes your account and associated data. We may suspend or terminate accounts that breach these terms or that we are required to act on by law.',
  },
  {
    heading: '11. Changes to these terms',
    body: 'We may revise these terms as the app evolves. When we do, we will update the date at the top of this page. Continuing to use GymCrush after a change means you accept the updated terms.',
  },
  {
    heading: '12. Contact',
    body: 'Questions about these terms? Email support@gymcrush.app.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Terms & Conditions" />
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
