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
    accentDeep: string;
    accentSoft: string;
    accentText: string;
    accent2: string;
    skyGradient: readonly [string, string, string];
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
    xl: number;
    full: number;
  };
  type: {
    title: number;
    heading: number;
    body: number;
    caption: number;
    amount: number;
  };
  shadows: {
    card: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number };
    fab: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number };
    button: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number };
  };
}

const lightColors: ThemeTokens['colors'] = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E7EAF3',
  text: '#0F172A',
  textSecondary: '#64748B',
  accent: '#6366F1',
  accentDeep: '#4F46E5',
  accentSoft: '#EEF0FF',
  accentText: '#FFFFFF',
  accent2: '#C084FC',
  skyGradient: ['#DAE0FF', '#E9E8FF', '#F6ECFF'],
  income: '#047857',
  expense: '#E11D48',
  warning: '#D97706',
  danger: '#E11D48',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#6366F1',
  tabBarInactive: '#64748B',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

const darkColors: ThemeTokens['colors'] = {
  background: '#0A0E17',
  surface: '#121828',
  surfaceElevated: '#1A2133',
  border: '#232B40',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#818CF8',
  accentDeep: '#6366F1',
  accentSoft: '#232A4D',
  accentText: '#0A0E17',
  accent2: '#7C3AED',
  skyGradient: ['#181343', '#2B2770', '#4A2B8F'],
  income: '#34D399',
  expense: '#FB7185',
  warning: '#FBBF24',
  danger: '#FB7185',
  tabBarBackground: '#0D1220',
  tabBarActive: '#818CF8',
  tabBarInactive: '#64748B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function buildTheme(scheme: ResolvedScheme): ThemeTokens {
  return {
    scheme,
    colors: scheme === 'light' ? lightColors : darkColors,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 36 },
    radii: { sm: 10, md: 14, lg: 22, xl: 30, full: 9999 },
    type: { title: 30, heading: 22, body: 16, caption: 13, amount: 38 },
    shadows: {
      card: {
        shadowColor: scheme === 'light' ? '#0F172A' : '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: scheme === 'light' ? 0.05 : 0.35,
        shadowRadius: 10,
      },
      fab: {
        shadowColor: scheme === 'light' ? '#4F46E5' : '#818CF8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      button: {
        shadowColor: scheme === 'light' ? '#0F172A' : '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
    },
  };
}
