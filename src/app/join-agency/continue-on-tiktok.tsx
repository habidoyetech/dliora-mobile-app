import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

const NEXT_STEPS = [
  'Complete the application inside TikTok',
  "Once accepted into TikTok's Backstage program, our admin team sets up your D-Liora account.",
  "We'll DM you on TikTok with your platform link, username, and a temporary password.",
];

/**
 * The application is in; TikTok's own flow finishes it. Each region has its own
 * programme link, which the application response hands back.
 */
export default function ContinueOnTikTokScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { regionName, tiktokLink } = useLocalSearchParams<{
    regionName?: string;
    tiktokLink?: string;
  }>();

  const link = tiktokLink?.trim();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <Image source={require('@/assets/images/logo-full.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.heroTitle}>You&apos;re almost done..</Text>
        </View>

        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.title}>One Step Left on TikTok</Text>

          <Text style={styles.body}>
            Your application has been matched to the{' '}
            <Text style={styles.region}>{regionName ?? 'your region'}</Text> agency program.
          </Text>
          <Text style={styles.body}>
            {link
              ? 'Tap the button to continue on TikTok and finish your agency application.'
              : "We'll send you the link to finish your application on TikTok."}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>WHAT HAPPENS NEXT</Text>
            {NEXT_STEPS.map((step) => (
              <View key={step} style={styles.step}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            {/* No link for this region yet — don't show a button that goes nowhere. */}
            {!!link && (
              <PrimaryButton
                label="Continue on TikTok"
                onPress={() =>
                  WebBrowser.openBrowserAsync(link, {
                    toolbarColor: Brand.ink,
                    controlsColor: Brand.gold,
                  })
                }
              />
            )}
            <Pressable
              onPress={() => router.replace('/sign-in')}
              hitSlop={8}
              style={styles.done}
              accessibilityRole="link">
              <Text style={styles.link}>Back to Login</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Brand.ink },
    scroll: { flexGrow: 1 },
    hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 48, gap: 28 },
    logo: { width: 170, height: 48 },
    heroTitle: { fontFamily: Font.bold, fontSize: 24, color: OnInk.text, textAlign: 'center' },
    sheet: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 30,
      gap: 14,
      backgroundColor: t.surface,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
    },
    title: { fontFamily: Font.bold, fontSize: 22, color: t.text, letterSpacing: -0.3 },
    body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.textMuted },
    region: { fontFamily: Font.semibold, color: t.link },
    card: {
      marginTop: 8,
      padding: 18,
      gap: 10,
      borderRadius: Radius.field,
      backgroundColor: t.surfaceRaised,
    },
    cardTitle: { fontFamily: Font.semibold, fontSize: 12, letterSpacing: 1, color: t.text },
    step: { flexDirection: 'row', gap: 10 },
    bullet: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, color: t.textFaint },
    stepText: { flex: 1, fontFamily: Font.regular, fontSize: 14, lineHeight: 22, color: t.textMuted },
    actions: { marginTop: 'auto', paddingTop: 24, gap: 18 },
    done: { alignSelf: 'center' },
    link: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
