import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand } from '@/constants/theme';

/** Matches `imageWidth` of the native splash in app.json, so the hand-off is seamless. */
const LOGO_SIZE = 240;
/** Let the brand moment breathe, even on a fast launch. */
const MIN_VISIBLE_MS = 900;

/**
 * Takes over from the native splash (same logo, same spot), shows a soft
 * gold glow while the session loads, then lifts away to reveal the app.
 */
export function BrandSplash({ ready }: { ready: boolean }) {
  const [mounted, setMounted] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  const glow = useSharedValue(0.35);
  const logoScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Our overlay is drawn — hide the native splash underneath it.
  const onLayout = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    glow.set(withRepeat(withSequence(withTiming(0.85, { duration: 1100 }), withTiming(0.35, { duration: 1100 })), -1));
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [glow]);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    logoScale.set(withTiming(1.12, { duration: 520, easing: Easing.out(Easing.cubic) }));
    opacity.set(
      withDelay(
        120,
        withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      ),
    );
  }, [ready, minElapsed, logoScale, opacity]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.get() }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]} onLayout={onLayout} pointerEvents={ready ? 'none' : 'auto'}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={logoStyle}>
        <Image source={require('@/assets/images/logo-full.png')} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    experimental_backgroundImage: `radial-gradient(circle, ${Brand.goldDeep} 0%, rgba(12,13,14,0) 70%)`,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});

/** Keeps the native splash up until <BrandSplash> is on screen. Call once, at module scope. */
export function holdNativeSplash() {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}
