import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Font, type ThemeColors } from '@/constants/theme';
import { useScheme, useThemedStyles } from '@/hooks/use-theme';

/**
 * Placeholder home so sign-in can be tried end to end. The creator and
 * manager dashboards replace this next.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const scheme = useScheme();
  const { user, signOut } = useSession();
  const name = user?.greeting_name || user?.tiktok_handle || 'there';
  const roles = (user?.roles ?? []).filter((r) => r !== 'admin');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Image source={require('@/assets/images/logo-mark.png')} style={styles.mark} contentFit="contain" />
      <Text style={styles.title}>Hi, {name}!</Text>
      <Text style={styles.body}>
        You&apos;re signed in{roles.length ? ` as a ${roles.join(' & ')}` : ''}. Your dashboard is coming next.
      </Text>
      <Pressable onPress={signOut} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: 24,
      backgroundColor: t.background,
    },
    mark: { width: 72, height: 72 },
    title: { fontFamily: Font.bold, fontSize: 26, color: t.text },
    body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, color: t.textMuted, textAlign: 'center' },
    signOut: {
      marginTop: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.border,
    },
    signOutText: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
  });
