import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Brand, Font, Radius } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  label: string;
  loading?: boolean;
};

/** The gold call-to-action — presses down slightly, shows a spinner while busy. */
export function PrimaryButton({ label, loading, disabled, onPressIn, onPressOut, ...props }: Props) {
  const scale = useSharedValue(1);
  const pressed = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const inactive = disabled || loading;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPressIn={(e) => {
        scale.set(withSpring(0.97, { damping: 18, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 18, stiffness: 400 }));
        onPressOut?.(e);
      }}
      style={[styles.button, disabled && !loading && styles.disabled, pressed]}
      {...props}>
      {loading ? <ActivityIndicator color={Brand.ink} /> : <Text style={styles.label}>{label}</Text>}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gold,
    shadowColor: Brand.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  disabled: { opacity: 0.5 },
  label: { fontFamily: Font.semibold, fontSize: 16, color: Brand.ink, letterSpacing: 0.2 },
});
