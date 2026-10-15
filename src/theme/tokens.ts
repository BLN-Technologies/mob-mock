export const colors = {
  // Brand
  primary: '#0FAA38',
  primaryDark: '#0B3B24',
  secondary: '#22C55E',
  accent: '#06EFAC',
  brandForest: '#084826',

  // Neutrals
  neutralDark: '#0F172A',
  neutralGray: '#6B7280',
  neutralLight: '#94A3B8',
  background: '#F5F4F6',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  borderFocus: '#0FAA38',

  // Status Colors
  success: '#0FAA38',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  draft: '#64748B',
  draftLight: '#F1F5F9',
  offline: '#D97706',
  offlineLight: '#FEF3C7',
};

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    color: colors.neutralDark,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    color: colors.neutralDark,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    color: colors.neutralDark,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: colors.neutralDark,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
    color: colors.neutralDark,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    color: colors.neutralGray,
  },
  smallMedium: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: colors.neutralDark,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    color: colors.neutralGray,
  },
};

export const spacing = {
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
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
