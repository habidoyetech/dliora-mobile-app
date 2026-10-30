import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/** Nothing to subscribe to — hydration happens once and never reverses. */
const subscribe = () => () => {};

/**
 * Static rendering has no colour scheme to read, so report light until the
 * client has hydrated. `useSyncExternalStore` gives us the server/client split
 * directly, without the setState-in-an-effect cascade.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
