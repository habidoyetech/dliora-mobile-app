import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';
import { ApiError, api } from '@/lib/api';

const haptic = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type).catch(() => {});
};

/**
 * The API answers the same way whether or not the email exists, so nobody can
 * probe for valid accounts. That's deliberate — never surface a "no such
 * account" error here, and show the confirmation either way.
 */
export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setFieldError('Enter the email on your account.');
      haptic(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (submitting) return;

    setFieldError(undefined);
    setError(null);
    setSubmitting(true);

    try {
      const res = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      haptic(Haptics.NotificationFeedbackType.Success);
      setConfirmation(res.message);
    } catch (err) {
      haptic(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        setFieldError(err.errors.email?.[0]);
        if (!err.errors.email) setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
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
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <Image
            source={require('@/assets/images/logo-full.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          <View style={styles.intro}>
            <Text style={styles.title}>Forgot Your Password?</Text>
            <Text style={styles.body}>
              Enter the email associated with your account and we&apos;ll send you a new temporary password.
            </Text>
          </View>

          {!!error && (
            <View style={styles.alert} accessibilityRole="alert">
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <TextField
            label="Email"
            placeholder="user@email.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (fieldError) setFieldError(undefined);
            }}
            error={fieldError}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          <View style={styles.actions}>
            <PrimaryButton label="Request Password Reset" loading={submitting} onPress={submit} />
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.back}
              accessibilityRole="link">
              <Text style={styles.link}>← Back to Login</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>

      <ModalSheet
        visible={!!confirmation}
        illustration={require('@/assets/images/mail-sent.png')}
        title="Request Submitted"
        body={confirmation ?? undefined}
        onAction={() => {
          setConfirmation(null);
          router.back();
        }}
      />
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Brand.ink },
    scroll: { flexGrow: 1 },
    hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72 },
    logo: { width: 190, height: 56 },
    sheet: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      gap: 22,
      backgroundColor: t.surface,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
    },
    intro: { gap: 10 },
    title: { fontFamily: Font.bold, fontSize: 24, color: t.text, letterSpacing: -0.4 },
    body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.textMuted },
    alert: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.dangerSurface },
    alertText: { fontFamily: Font.medium, fontSize: 14, lineHeight: 20, color: t.danger },
    actions: { marginTop: 8, gap: 18 },
    back: { alignSelf: 'center' },
    link: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
