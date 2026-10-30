import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChoiceField } from '@/components/ui/choice-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useRegions } from '@/hooks/use-regions';
import { useThemedStyles } from '@/hooks/use-theme';
import { ApiError, api } from '@/lib/api';

const haptic = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type).catch(() => {});
};

// Same wording as the web form, so the two clients don't drift.
const FREQUENCY_OPTIONS: SelectOption[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'A few times a week', value: 'several_times_week' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Occasionally', value: 'occasionally' },
];

const NICHE_OPTIONS: SelectOption[] = [
  { label: 'Fashion & Beauty', value: 'beauty' },
  { label: 'Comedy & Entertainment', value: 'comedy' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Lifestyle & Vlogging', value: 'lifestyle' },
  { label: 'Other', value: 'other' },
];

type FieldErrors = Record<string, string | undefined>;

/** "Tell Us About Your TikTok" — the public agency application. */
export default function JoinAgencyScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const regions = useRegions();

  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [followers, setFollowers] = useState('');
  const [hasGoneLive, setHasGoneLive] = useState<boolean | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [niche, setNiche] = useState<string | null>(null);
  const [goals, setGoals] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const regionOptions: SelectOption[] = (regions.data ?? []).map((r) => ({ label: r.name, value: r.code }));

  const clearField = (key: string) => setFieldErrors((f) => ({ ...f, [key]: undefined }));

  const submit = async () => {
    // Strip the grouping separators people type into follower counts.
    const followerCount = followers.replace(/[\s,]/g, '');

    const missing: FieldErrors = {
      email: email.trim() ? undefined : 'Enter your email.',
      tiktok_username: handle.trim() ? undefined : 'Enter your TikTok username.',
      region: region ? undefined : 'Choose your region.',
      follower_count: /^\d+$/.test(followerCount) ? undefined : 'Enter your follower count as a number.',
      has_gone_live: hasGoneLive === null ? 'Let us know if you have gone LIVE.' : undefined,
      live_frequency: frequency ? undefined : 'Choose how often you plan to go LIVE.',
      niche: niche ? undefined : 'Choose your niche.',
    };

    setFieldErrors(missing);
    setError(null);
    if (Object.values(missing).some(Boolean) || submitting) {
      haptic(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api<{
        message: string;
        region: { name: string; code: string; tiktok_link: string | null };
      }>('/agency/applications', {
        method: 'POST',
        body: {
          email: email.trim(),
          // The API stores the handle without the leading "@".
          tiktok_username: handle.trim().replace(/^@/, ''),
          region,
          follower_count: Number(followerCount),
          has_gone_live: hasGoneLive,
          live_frequency: frequency,
          niche,
          goals: goals.trim() || null,
        },
      });

      haptic(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/join-agency/continue-on-tiktok',
        params: {
          regionName: res.region.name,
          regionCode: res.region.code,
          tiktokLink: res.region.tiktok_link ?? '',
        },
      });
    } catch (err) {
      haptic(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        const mapped: FieldErrors = {};
        for (const [key, messages] of Object.entries(err.errors)) mapped[key] = messages[0];

        // "has already been taken" is how Laravel words a duplicate; say what
        // it actually means for someone who applied last week.
        const duplicate = err.errors.email?.[0] ?? err.errors.tiktok_username?.[0];
        if (duplicate?.includes('already been taken')) {
          setError('You have already applied. Check your TikTok DMs — we follow up there.');
        } else {
          setError(Object.keys(err.errors).length ? null : err.message);
        }
        setFieldErrors(mapped);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <Image source={require('@/assets/images/logo-full.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.heroTitle}>Let&apos;s get you in</Text>
          <Text style={styles.heroBody}>We review every application and follow up on TikTok directly.</Text>
        </View>

        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.sheetTitle}>Tell Us About Your TikTok</Text>

          {!!error && (
            <View style={styles.alert} accessibilityRole="alert">
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <View style={styles.fields}>
            <TextField
              label="Email"
              placeholder="user@email.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearField('email');
              }}
              error={fieldErrors.email}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
            />

            <TextField
              label="TikTok username / handle"
              placeholder="@yourhandle"
              value={handle}
              onChangeText={(v) => {
                setHandle(v);
                clearField('tiktok_username');
              }}
              error={fieldErrors.tiktok_username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <SelectField
              label="Region"
              placeholder="Select region"
              options={regionOptions}
              value={region}
              loading={regions.isLoading}
              onChange={(v) => {
                setRegion(v);
                clearField('region');
              }}
              error={fieldErrors.region}
            />
            {regions.isError && (
              <Pressable onPress={() => regions.refetch()} hitSlop={8} accessibilityRole="button">
                <Text style={styles.retry}>Couldn&apos;t load regions. Tap to try again.</Text>
              </Pressable>
            )}

            <TextField
              label="Current follower count"
              placeholder="e.g 2,500"
              value={followers}
              onChangeText={(v) => {
                setFollowers(v);
                clearField('follower_count');
              }}
              error={fieldErrors.follower_count}
              keyboardType="number-pad"
            />

            <ChoiceField
              label="Have you gone LIVE before?"
              options={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ]}
              value={hasGoneLive}
              onChange={(v) => {
                setHasGoneLive(v);
                clearField('has_gone_live');
              }}
              error={fieldErrors.has_gone_live}
            />

            <SelectField
              label="How often do you plan to go LIVE?"
              placeholder="Select frequency"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(v) => {
                setFrequency(v);
                clearField('live_frequency');
              }}
              error={fieldErrors.live_frequency}
            />

            <SelectField
              label="What's your niche?"
              placeholder="Select niche"
              options={NICHE_OPTIONS}
              value={niche}
              onChange={(v) => {
                setNiche(v);
                clearField('niche');
              }}
              error={fieldErrors.niche}
            />

            <TextField
              label="How do you want the agency to help you?"
              placeholder="Tell us what you're hoping to get out of joining.."
              value={goals}
              onChangeText={setGoals}
              error={fieldErrors.goals}
              multiline
            />
          </View>

          <PrimaryButton label="Submit Application" loading={submitting} onPress={submit} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8} accessibilityRole="link">
              <Text style={styles.link}>Sign In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Brand.ink },
    scroll: { flexGrow: 1 },
    hero: { paddingHorizontal: 24, paddingBottom: 36, gap: 10 },
    logo: { width: 150, height: 44, marginBottom: 18 },
    heroTitle: { fontFamily: Font.bold, fontSize: 24, color: OnInk.text, textAlign: 'center' },
    heroBody: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: OnInk.muted, textAlign: 'center' },
    sheet: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 30,
      gap: 22,
      backgroundColor: t.surface,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
    },
    sheetTitle: { fontFamily: Font.bold, fontSize: 22, color: t.text, letterSpacing: -0.3 },
    alert: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.dangerSurface },
    alertText: { fontFamily: Font.medium, fontSize: 14, lineHeight: 20, color: t.danger },
    fields: { gap: 18 },
    retry: { fontFamily: Font.medium, fontSize: 13, color: t.danger, marginTop: -8 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
    footerText: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },
    link: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
