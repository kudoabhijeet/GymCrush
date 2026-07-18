import { useColorScheme } from 'nativewind';

/**
 * JS-side mirror of the CSS-variable tokens in global.css, for props that
 * can't take a className: tab bar tints, icon colors, placeholderTextColor,
 * selectionColor, navigator background, StatusBar style.
 *
 * Keep in sync with global.css.
 */

export const BRAND = '#ccff00';
export const BRAND_DARK = '#a6d400';
export const BRAND_FG = '#0a0c0b';
export const ACCENT = '#ff5a1f';

export interface ThemeColors {
  scheme: 'light' | 'dark';
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  content: string;
  contentMuted: string;
  contentFaint: string;
  brand: string;
  brandFg: string;
  brandText: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
}

export const palette: Record<'light' | 'dark', ThemeColors> = {
  light: {
    scheme: 'light',
    surface: '#f6f8f5',
    surfaceElevated: '#ffffff',
    surfaceMuted: '#e7ece6',
    content: '#161a17',
    contentMuted: '#57625c',
    contentFaint: '#98a29c',
    brand: BRAND,
    brandFg: BRAND_FG,
    brandText: '#4d7c0f',
    accent: ACCENT,
    danger: '#dc2626',
    warning: '#b45309',
    success: '#15803d',
  },
  dark: {
    scheme: 'dark',
    surface: '#0a0c0b',
    surfaceElevated: '#14181a',
    surfaceMuted: '#1f2528',
    content: '#f4f6f5',
    contentMuted: '#9aa4a2',
    contentFaint: '#5d6a67',
    brand: BRAND,
    brandFg: BRAND_FG,
    brandText: BRAND,
    accent: ACCENT,
    danger: '#ff4d4d',
    warning: '#ffb020',
    success: '#3ddc84',
  },
};

/** Current theme's JS colors; re-renders on system/manual scheme change. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return palette[colorScheme === 'dark' ? 'dark' : 'light'];
}
