/**
 * D-Liora brand colours — the same palette as the web portal (globals.css):
 * a near-black ink with a warm gold accent.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  /** gold — buttons, focus rings, the brand mark */
  gold: '#DDA63C',
  goldSoft: '#F5EABC',
  goldDeep: '#3F320E',
  goldGlow: '#2A2109',
  /** near-black ink — splash and the sign-in hero, dark in either scheme */
  ink: '#0C0D0E',
  inkRaised: '#15171A',
  inkLine: '#26292D',
  white: '#FFFFFF',
} as const;

/**
 * Everything that flips with the colour scheme. Brand colours above don't —
 * the splash and the sign-in hero are deliberately dark in both.
 */
export type ThemeColors = {
  /** page behind everything */
  background: string;
  /** cards, sheets, the surface the content sits on */
  surface: string;
  /** inputs and other wells that sit above `surface` */
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** gold is too pale on white — links get a darker gold in light mode */
  link: string;
  danger: string;
  dangerSurface: string;
  success: string;
};

export const Themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceRaised: '#F5F5F6',
    border: '#E6E6E6',
    text: '#232629',
    textMuted: '#6D7378',
    textFaint: '#AFB3B6',
    link: '#9A6B16',
    danger: '#D42626',
    dangerSurface: '#FDECEC',
    success: '#15803D',
  },
  dark: {
    background: Brand.ink,
    surface: Brand.inkRaised,
    surfaceRaised: '#1F2226',
    border: Brand.inkLine,
    text: '#F2F3F4',
    textMuted: '#9DA3A9',
    textFaint: '#6B7177',
    link: Brand.gold,
    danger: '#FF7A7A',
    dangerSurface: '#2B1618',
    success: '#4ADE80',
  },
};

/** Text sitting on the ink hero, which is dark whatever the scheme. */
export const OnInk = {
  text: Brand.white,
  muted: 'rgba(255,255,255,0.65)',
} as const;

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
  /** fully rounded — every CTA in the designs is a pill */
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
