import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accessFor, useSession } from '@/auth/session';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Brand, Font, OnInk } from '@/constants/theme';
import { WEB_URL } from '@/lib/config';

/**
 * Every portal this account holds is currently restricted. The API would 403
 * each request, so say why here instead of letting them walk into an app where
 * nothing loads.
 */
export default function RestrictedScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const access = user ? accessFor(user) : null;
  const reason = access?.kind === 'restricted' ? access.reason : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar style="light" />
      <View style={styles.glow} />

      <Image source={require('@/assets/images/logo-mark.png')} style={styles.mark} contentFit="contain" />

      <Text style={styles.title}>Your access is on hold</Text>
      <Text style={styles.body}>
        {reason ?? 'Your D-Liora access is currently restricted. The team can tell you more.'}
      </Text>

      <View style={styles.actions}>
        <PrimaryButton
          label="Contact the D-Liora team"
          onPress={() =>
            WebBrowser.openBrowserAsync(`${WEB_URL}/creator/support-tickets`, {
              toolbarColor: Brand.ink,
              controlsColor: Brand.gold,
            })
          }
        />
        <Pressable onPress={signOut} hitSlop={8} style={styles.signOut} accessibilityRole="button">
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 28,
    backgroundColor: Brand.ink,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    width: 420,
    height: 420,
    borderRadius: 210,
    experimental_backgroundImage: `radial-gradient(circle, ${Brand.goldDeep} 0%, rgba(12,13,14,0) 70%)`,
  },
  mark: { width: 64, height: 64, marginBottom: 8 },
  title: { fontFamily: Font.bold, fontSize: 26, color: OnInk.text, textAlign: 'center', letterSpacing: -0.4 },
  body: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: OnInk.muted,
    textAlign: 'center',
  },
  actions: { alignSelf: 'stretch', marginTop: 24, gap: 18 },
  signOut: { alignSelf: 'center' },
  link: { fontFamily: Font.semibold, fontSize: 14, color: Brand.gold },
});
