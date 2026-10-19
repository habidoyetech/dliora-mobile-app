/**
 * D-Liora brand colours — the same palette as the web portal (globals.css):
 * a near-black ink with a warm gold accent.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  /** gold — buttons, links, focus */
  gold: '#DDA63C',
  goldSoft: '#F5EABC',
  goldDeep: '#3F320E',
  goldGlow: '#2A2109',
  /** near-black ink — splash, sign-in hero */
  ink: '#0C0D0E',
  inkRaised: '#15171A',
  inkLine: '#26292D',
  white: '#FFFFFF',
  /** text */
  text: '#232629',
  textMuted: '#6D7378',
  textFaint: '#AFB3B6',
  /** surfaces */
  page: '#FAFAFA',
  field: '#F5F5F6',
  line: '#E6E6E6',
  danger: '#E83030',
  dangerSoft: '#FDECEC',
  success: '#16A34A',
} as const;

export const Colors = {
  light: {
    text: Brand.text,
    background: Brand.page,
    backgroundElement: Brand.field,
    backgroundSelected: Brand.line,
    textSecondary: Brand.textMuted,
  },
  dark: {
    text: '#F2F2F2',
    background: Brand.ink,
    backgroundElement: Brand.inkRaised,
    backgroundSelected: Brand.inkLine,
    textSecondary: Brand.textFaint,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Inter, as on the web portal (loaded in the root layout). */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  field: 14,
  button: 16,
  sheet: 32,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
