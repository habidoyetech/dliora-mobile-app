import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { PasswordChecklist, isPasswordValid } from '@/components/ui/password-checklist';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

const haptic = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type).catch(() => {});
};

/**
 * "Set a new password before continuing" — shown when the account still has a
 * temporary password. The API keeps this session's token alive and revokes the
 * rest, so finishing here drops straight into the app.
 */
export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { user, changePassword, signOut } = useSession();
  const forced = !!user?.must_change_password;

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [done, setDone] = useState(false);

  const matches = confirmPassword.length > 0 && password === confirmPassword;
  // The API rejects a new password equal to the old one; say so before they submit.
  const reusesCurrent = !forced && currentPassword.length > 0 && password === currentPassword;

  const submit = async () => {
    const missing = {
      current_password: forced || currentPassword ? undefined : 'Enter your current password.',
      password: reusesCurrent
        ? 'Your new password must be different from your current one.'
        : isPasswordValid(password)
          ? undefined
          : 'Your password does not meet the requirements yet.',
      password_confirmation: matches ? undefined : 'Both passwords must match.',
    };
    setFieldErrors(missing);
    setError(null);
    if (Object.values(missing).some(Boolean) || submitting) {
      haptic(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: forced ? undefined : currentPassword,
        password,
        passwordConfirmation: confirmPassword,
      });
      haptic(Haptics.NotificationFeedbackType.Success);
      // Confirm before the guard moves them on, so the change is acknowledged
      // rather than the screen just vanishing underneath them.
      setDone(true);
    } catch (err) {
      haptic(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        setError(err.message);
        // Surface Laravel's per-field messages where they belong.
        setFieldErrors({
          current_password: err.errors.current_password?.[0],
          password: err.errors.password?.[0],
          password_confirmation: err.errors.password_confirmation?.[0],
        });
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
        <View style={[styles.hero, { paddingTop: insets.top + 28 }]}>
          <View style={styles.heroGlow} />
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text style={styles.title}>{forced ? 'Set a new\npassword' : 'Change your\npassword'}</Text>
            <Text style={styles.subtitle}>
              {forced
                ? 'You signed in with a temporary password. Choose one of your own to continue.'
                : 'Pick something you have not used here before.'}
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(120).duration(550)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          {!!error && (
            <View style={styles.alert} accessibilityRole="alert">
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <View style={styles.fields}>
            {!forced && (
              <TextField
                label="Current password"
                placeholder="Your current password"
                password
                value={currentPassword}
                onChangeText={(v) => {
                  setCurrentPassword(v);
                  setFieldErrors((f) => ({ ...f, current_password: undefined }));
                }}
                error={fieldErrors.current_password}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            )}

            <View style={styles.newPasswordBlock}>
              <TextField
                ref={passwordRef}
                label="New password"
                placeholder="Your new password"
                password
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                error={fieldErrors.password}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <PasswordChecklist value={password} />
            </View>

            <TextField
              ref={confirmRef}
              label="Confirm new password"
              placeholder="Type it once more"
              password
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setFieldErrors((f) => ({ ...f, password_confirmation: undefined }));
              }}
              error={fieldErrors.password_confirmation}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>

          <PrimaryButton label="Set Password & Continue" loading={submitting} onPress={submit} />

          <Pressable onPress={signOut} hitSlop={8} style={styles.signOut} accessibilityRole="button">
            <Text style={styles.link}>Sign out instead</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>

      <ModalSheet
        visible={done}
        illustration={require('@/assets/images/success-tick.png')}
        title="Password Updated"
        body="Your password has been updated. Every other device signed in as you has been signed out."
        actionLabel="Continue"
        onAction={() => setDone(false)}
      />
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Brand.ink },
    scroll: { flexGrow: 1 },

    hero: { paddingHorizontal: 24, paddingBottom: 48, overflow: 'hidden' },
    heroGlow: {
      position: 'absolute',
      top: -140,
      right: -140,
      width: 360,
      height: 360,
      borderRadius: 180,
      experimental_backgroundImage: `radial-gradient(circle, ${Brand.goldDeep} 0%, rgba(12,13,14,0) 70%)`,
    },
    title: { fontFamily: Font.bold, fontSize: 36, lineHeight: 42, color: OnInk.text, letterSpacing: -0.8 },
    subtitle: {
      marginTop: 12,
      fontFamily: Font.regular,
      fontSize: 15,
      lineHeight: 22,
      color: OnInk.muted,
    },

    sheet: {
      flexGrow: 1,
      marginTop: -24,
      paddingHorizontal: 24,
      paddingTop: 32,
      gap: 24,
      backgroundColor: t.surface,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
    },
    alert: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.dangerSurface },
    alertText: { fontFamily: Font.medium, fontSize: 14, lineHeight: 20, color: t.danger },
    fields: { gap: 18 },
    newPasswordBlock: { gap: 12 },
    signOut: { alignSelf: 'center', marginTop: 'auto', paddingTop: 8 },
    link: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
