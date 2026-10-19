import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSession } from "@/auth/session";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { Brand, Font, Radius } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { WEB_URL } from "@/lib/config";

const haptic = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== "web") Haptics.notificationAsync(type).catch(() => {});
};

/**
 * "Log In" — creators and managers sign in with their TikTok username or
 * email, as on the web portal. The protected stack moves them on once signed in.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    login?: string;
    password?: string;
  }>({});

  const submit = async () => {
    const missing = {
      login: login.trim() ? undefined : "Enter your TikTok username or email.",
      password: password ? undefined : "Enter your password.",
    };
    setFieldErrors(missing);
    setError(null);
    if (missing.login || missing.password || submitting) {
      haptic(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSubmitting(true);
    try {
      await signIn(login.trim(), password);
      haptic(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      haptic(Haptics.NotificationFeedbackType.Error);
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  const openWeb = (path: string) =>
    WebBrowser.openBrowserAsync(`${WEB_URL}${path}`, {
      toolbarColor: Brand.ink,
      controlsColor: Brand.gold,
    });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 28 }]}>
          <View style={styles.heroGlow} />
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.brandRow}
          >
            <Image
              source={require("@/assets/images/logo-mark.png")}
              style={styles.mark}
              contentFit="contain"
            />
            <Text style={styles.brandName}>D-LIORA</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Text style={styles.title}>Welcome{"\n"}back</Text>
            <Text style={styles.subtitle}>
              Log in to continue your creator journey.
            </Text>
          </Animated.View>
        </View>

        {/* Form sheet */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(550)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}
        >
          <Text style={styles.sheetTitle}>Log in to your account</Text>

          {!!error && (
            <View style={styles.alert} accessibilityRole="alert">
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <View style={styles.fields}>
            <TextField
              label="TikTok Username or Email"
              placeholder="@yourhandle or you@email.com"
              value={login}
              onChangeText={(v) => {
                setLogin(v);
                if (fieldErrors.login)
                  setFieldErrors((f) => ({ ...f, login: undefined }));
              }}
              error={fieldErrors.login}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="email-address"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <View style={styles.passwordBlock}>
              <TextField
                ref={passwordRef}
                label="Password"
                placeholder="Your password"
                password
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (fieldErrors.password)
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                error={fieldErrors.password}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <Pressable
                onPress={() => openWeb("/forgot-password")}
                hitSlop={8}
                style={styles.forgot}
                accessibilityRole="link"
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </View>
          </View>

          <PrimaryButton label="Log In" loading={submitting} onPress={submit} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Pressable
              onPress={() => openWeb("/creator/join-agency")}
              hitSlop={8}
              accessibilityRole="link"
            >
              <Text style={styles.link}>Join Agency</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.ink },
  scroll: { flexGrow: 1 },

  hero: {
    paddingHorizontal: 24,
    paddingBottom: 56,
    gap: 28,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 380,
    height: 380,
    borderRadius: 190,
    experimental_backgroundImage: `radial-gradient(circle, ${Brand.goldDeep} 0%, rgba(12,13,14,0) 70%)`,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 44, height: 44 },
  brandName: {
    fontFamily: Font.extrabold,
    fontSize: 18,
    letterSpacing: 3,
    color: Brand.white,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 40,
    lineHeight: 46,
    color: Brand.white,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.65)",
  },

  sheet: {
    flexGrow: 1,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
    backgroundColor: Brand.white,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
  },
  sheetTitle: {
    fontFamily: Font.semibold,
    fontSize: 22,
    color: Brand.text,
    letterSpacing: -0.3,
  },
  alert: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Brand.dangerSoft,
  },
  alertText: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.danger,
  },
  fields: { gap: 18 },
  passwordBlock: { gap: 10 },
  forgot: { alignSelf: "flex-end" },
  link: { fontFamily: Font.semibold, fontSize: 14, color: Brand.gold },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 8,
  },
  footerText: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: Brand.textMuted,
  },
});
