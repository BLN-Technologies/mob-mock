export const colors = {
  // Brand - Refined Rwandan Agricultural Palette
  primary: '#0FAA38',
  primaryDark: '#0B3B24',
  primaryDeep: '#064E3B',
  primaryLight: '#E8F5E9',
  primaryMuted: '#22C55E',
  accent: '#06EFAC',
  accentDark: '#00A86B',
  brandForest: '#084826',
  brandGold: '#D97706',
  brandAmber: '#F59E0B',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  backgroundWarm: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceCard: '#FFFFFF',
  surfaceHighlighted: '#F0FDF4',
  
  // Neutrals & Slate
  neutralDark: '#0F172A',
  neutralHeadings: '#1E293B',
  neutralBody: '#334155',
  neutralGray: '#64748B',
  neutralLight: '#94A3B8',
  neutralSubtle: '#CBD5E1',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0FAA38',
  divider: '#EEF2F6',

  // Status & Semantic Colors
  success: '#0FAA38',
  successDark: '#15803D',
  successLight: '#DCFCE7',
  successBorder: '#86EFAC',
  
  warning: '#D97706',
  warningDark: '#B45309',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',
  
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerLight: '#FEE2E2',
  dangerBorder: '#FCA5A5',
  
  info: '#2563EB',
  infoDark: '#1D4ED8',
  infoLight: '#DBEAFE',
  infoBorder: '#93C5FD',
  
  draft: '#64748B',
  draftLight: '#F1F5F9',
  draftBorder: '#CBD5E1',

  offline: '#D97706',
  offlineLight: '#FFFBEB',

  // Crop Visual Accent Colors
  cropMaize: '#F59E0B',
  cropBeans: '#DC2626',
  cropRice: '#10B981',
  cropSoybeans: '#84CC16',
  cropPotatoes: '#D97706',
  cropCoffee: '#854D0E',
  cropCassava: '#0D9488',
};

export const typography = {
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800' as const,
    color: colors.neutralHeadings,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    color: colors.neutralHeadings,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: colors.neutralHeadings,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: colors.neutralGray,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    color: colors.neutralBody,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600' as const,
    color: colors.neutralHeadings,
  },
  small: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400' as const,
    color: colors.neutralGray,
  },
  smallMedium: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600' as const,
    color: colors.neutralHeadings,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    color: colors.neutralGray,
    letterSpacing: 0.2,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B3B24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B3B24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
};
