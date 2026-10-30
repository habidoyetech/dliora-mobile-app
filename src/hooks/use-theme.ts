import { useMemo } from 'react';

import { Themes, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type { ThemeColors };

/** The active scheme, with React Native's `unspecified`/null folded into light. */
export function useScheme(): 'light' | 'dark' {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** The colours for the active scheme. */
export function useTheme(): ThemeColors {
  return Themes[useScheme()];
}

/**
 * `StyleSheet.create` runs at module scope, which can't react to the scheme.
 * Pass a factory instead and the sheet is rebuilt only when the theme changes:
 *
 *   const makeStyles = (t: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (theme: ThemeColors) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
