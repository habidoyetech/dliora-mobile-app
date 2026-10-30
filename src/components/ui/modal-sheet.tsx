import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Font, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  /** Square illustration above the title. */
  illustration?: number;
  actionLabel?: string;
  onAction: () => void;
  children?: ReactNode;
};

/**
 * Centred confirmation card over a scrim. `onAction` is also what the Android
 * back button and an outside tap call, so there's always a way out.
 */
export function ModalSheet({
  visible,
  title,
  body,
  illustration,
  actionLabel = 'Okay',
  onAction,
  children,
}: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onAction} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onAction} accessibilityLabel="Dismiss" />

        <Animated.View entering={FadeInDown.duration(260)} style={styles.card}>
          {illustration !== undefined && (
            <Image source={illustration} style={styles.illustration} contentFit="contain" />
          )}
          <Text style={styles.title}>{title}</Text>
          {!!body && <Text style={styles.body}>{body}</Text>}
          {children}
          <View style={styles.action}>
            <PrimaryButton label={actionLabel} onPress={onAction} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      backgroundColor: 'rgba(12,13,14,0.55)',
    },
    card: {
      width: '100%',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
      borderRadius: Radius.sheet,
      backgroundColor: t.surface,
    },
    illustration: { width: 88, height: 88, marginBottom: 4 },
    title: { fontFamily: Font.bold, fontSize: 21, color: t.text, textAlign: 'center' },
    body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.textMuted, textAlign: 'center' },
    action: { alignSelf: 'stretch', marginTop: 12 },
  });
