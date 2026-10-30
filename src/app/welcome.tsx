import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Font, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

/** The photo fills the top of the screen; the copy sits below it. */
const HERO_RATIO = 0.56;

/**
 * First screen after the splash for anyone signed out — the one decision is
 * apply or sign in.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Animated.View entering={FadeIn.duration(600)} style={{ height: height * HERO_RATIO }}>
        <Image
          source={require('@/assets/images/bg-image.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top center"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(150).duration(550)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.headline}>
          <Text style={styles.title}>Learn, Create &amp;</Text>
          <View>
            <Text style={styles.title}>Grow on TikTok.</Text>
            {/* Stands in for the hand-drawn gold swash in the design. */}
            <View style={styles.underline} />
          </View>
        </View>

        <Text style={styles.subtitle}>
          Get the training, tools, and support to help creators thrive on TikTok, all in one place.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton label="Get Started" onPress={() => router.push('/join-agency')} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8} accessibilityRole="link">
              <Text style={styles.link}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.surface },
    sheet: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 36,
      gap: 16,
      backgroundColor: t.surface,
    },
    headline: { alignItems: 'center' },
    title: {
      fontFamily: Font.bold,
      fontSize: 32,
      lineHeight: 42,
      letterSpacing: -0.8,
      color: t.text,
      textAlign: 'center',
    },
    underline: {
      alignSelf: 'center',
      width: '62%',
      height: 4,
      marginTop: -2,
      borderRadius: 2,
      backgroundColor: t.link,
    },
    subtitle: {
      marginTop: 4,
      fontFamily: Font.regular,
      fontSize: 15,
      lineHeight: 23,
      color: t.textMuted,
      textAlign: 'center',
    },
    actions: { marginTop: 'auto', gap: 18 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },
    link: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
