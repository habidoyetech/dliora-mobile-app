import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { accessFor, SessionProvider, useSession } from '@/auth/session';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { BrandSplash, holdNativeSplash } from '@/components/brand-splash';
import { Brand } from '@/constants/theme';
import { createQueryClient } from '@/lib/query';

// Keep the native splash up until the branded one takes over.
holdNativeSplash();

/** Expo Router renders this when any route below the root throws. */
export { AppErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // One client for the app's lifetime; `useState` keeps it across re-renders.
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        {/* Outside the session on purpose — SessionProvider clears this cache
            on sign-out, so it has to exist first. */}
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <StatusBar style="light" />
            {(fontsLoaded || fontError) && <RootNavigator />}
            <SplashGate fontsReady={fontsLoaded || !!fontError} />
          </SessionProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

/**
 * Signed out → sign-in. Signed in, there are three ways in: blocked entirely,
 * still on a temporary password, or through to the app. Each guard owns one,
 * and they're mutually exclusive, so changing the session flips exactly one.
 */
function RootNavigator() {
  const { token, user } = useSession();
  // Both, deliberately: a token whose profile we never loaded would route into
  // the app with nothing to render.
  const session = token && user ? user : null;

  // Restriction first — no point making someone set a password for a portal
  // they can't open either way.
  const restricted = !!session && accessFor(session).kind === 'restricted';
  const mustChangePassword = !!session && !restricted && session.must_change_password;
  const intoApp = !!session && !restricted && !mustChangePassword;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: Brand.ink } }}>
      <Stack.Protected guard={intoApp}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={mustChangePassword}>
        <Stack.Screen name="change-password" />
      </Stack.Protected>
      <Stack.Protected guard={restricted}>
        <Stack.Screen name="restricted" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        {/* First listed is where signed-out visitors land. */}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="join-agency" />
      </Stack.Protected>
    </Stack>
  );
}

function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useSession();
  return <BrandSplash ready={fontsReady && !isLoading} />;
}
