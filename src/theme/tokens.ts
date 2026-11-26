export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

export interface ThemeTokens {
  scheme: ResolvedScheme;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    income: string;
    expense: string;
    warning: string;
    danger: string;
    tabBarBackground: string;
    tabBarActive: string;
    tabBarInactive: string;
    overlay: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  type: {
    title: number;
    heading: number;
    body: number;
    caption: number;
    amount: number;
  };
}

const lightColors: ThemeTokens['colors'] = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  accentText: '#FFFFFF',
  income: '#15803D',
  expense: '#DC2626',
  warning: '#D97706',
  danger: '#DC2626',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#4F46E5',
  tabBarInactive: '#9CA3AF',
  overlay: 'rgba(17, 24, 39, 0.45)',
};

const darkColors: ThemeTokens['colors'] = {
  background: '#0B0F19',
  surface: '#151B2B',
  surfaceElevated: '#1D2536',
  border: '#2A3347',
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  accent: '#818CF8',
  accentSoft: '#262C4A',
  accentText: '#0B0F19',
  income: '#4ADE80',
  expense: '#F87171',
  warning: '#FBBF24',
  danger: '#F87171',
  tabBarBackground: '#10152A',
  tabBarActive: '#818CF8',
  tabBarInactive: '#6B7280',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function buildTheme(scheme: ResolvedScheme): ThemeTokens {
  return {
    scheme,
    colors: scheme === 'light' ? lightColors : darkColors,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radii: { sm: 8, md: 12, lg: 20, full: 9999 },
    type: { title: 28, heading: 20, body: 16, caption: 13, amount: 22 },
  };
}
