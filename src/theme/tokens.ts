// Cargo Mobile V1 - Dark Forest Green Design System Tokens
export const lightColors = {
  // Brand - Refined Rwandan Agricultural Dark Forest Green Palette
  primary: '#174A35',
  primaryDark: '#103B2B',
  primaryDeep: '#0B281D',
  primaryLight: '#EAF2EC',
  primaryMuted: '#2F6B4F',
  accent: '#2F6B4F',
  accentDark: '#103B2B',
  accentLight: '#EAF2EC',
  brandForest: '#174A35',
  brandDeep: '#103B2B',
  brandGold: '#D97706',
  brandAmber: '#F59E0B',
  softMint: '#EAF2EC',

  // Surfaces & Backgrounds
  background: '#F7F8F5',
  backgroundWarm: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceSubtle: '#EAF2EC',
  surfaceCard: '#FFFFFF',
  surfaceHighlighted: '#EAF2EC',
  surfaceMint: '#EAF2EC',
  white: '#FFFFFF',
  error: '#B42318',

  // Neutrals & Slate
  neutralDark: '#202822',
  neutralHeadings: '#202822',
  neutralBody: '#202822',
  neutralGray: '#66716A',
  neutralLight: '#94A3B8',
  neutralSubtle: '#CBD5E1',
  border: '#DCE4DD',
  borderLight: '#EAEFEA',
  borderFocus: '#174A35',
  divider: '#E8EFE9',

  // Status & Semantic Colors
  success: '#174A35',
  successDark: '#103B2B',
  successLight: '#EAF2EC',
  successBorder: '#86EFAC',

  warning: '#A96812',
  warningDark: '#8A520B',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',

  danger: '#B42318',
  dangerDark: '#911B13',
  dangerLight: '#FEE2E2',
  dangerBorder: '#FCA5A5',

  info: '#2563EB',
  infoDark: '#1D4ED8',
  infoLight: '#DBEAFE',
  infoBorder: '#93C5FD',

  draft: '#66716A',
  draftLight: '#EAF2EC',
  draftBorder: '#DCE4DD',

  offline: '#A96812',
  offlineLight: '#FFFBEB',

  // Crop Visual Accent Colors
  cropMaize: '#F59E0B',
  cropBeans: '#B42318',
  cropRice: '#174A35',
  cropSoybeans: '#2F6B4F',
  cropPotatoes: '#A96812',
  cropCoffee: '#854D0E',
  cropCassava: '#0D9488',
};

export const darkColors = {
  // Brand - Dark theme
  primary: '#2F6B4F',
  primaryDark: '#103B2B',
  primaryDeep: '#0B281D',
  primaryLight: '#183024',
  primaryMuted: '#174A35',
  accent: '#3FA379',
  accentDark: '#103B2B',
  accentLight: '#1B3D2E',
  brandForest: '#2F6B4F',
  brandDeep: '#103B2B',
  brandGold: '#F59E0B',
  brandAmber: '#FBBF24',
  softMint: '#183024',

  // Surfaces & Backgrounds
  background: '#0D1410',
  backgroundWarm: '#121C16',
  surface: '#15211B',
  surfaceSubtle: '#1C2E25',
  surfaceCard: '#18261F',
  surfaceHighlighted: '#1E3329',
  surfaceMint: '#183024',
  white: '#15211B',
  error: '#F87171',

  // Neutrals
  neutralDark: '#F7F8F5',
  neutralHeadings: '#F7F8F5',
  neutralBody: '#DCE4DD',
  neutralGray: '#94A3B8',
  neutralLight: '#66716A',
  neutralSubtle: '#33483D',
  border: '#283C31',
  borderLight: '#1E3027',
  borderFocus: '#2F6B4F',
  divider: '#203328',

  // Status & Semantic Colors
  success: '#2F6B4F',
  successDark: '#174A35',
  successLight: '#183024',
  successBorder: '#2F6B4F',

  warning: '#F59E0B',
  warningDark: '#A96812',
  warningLight: '#3D2D10',
  warningBorder: '#A96812',

  danger: '#F87171',
  dangerDark: '#B42318',
  dangerLight: '#3A1513',
  dangerBorder: '#B42318',

  info: '#60A5FA',
  infoDark: '#2563EB',
  infoLight: '#172B4D',
  infoBorder: '#2563EB',

  draft: '#94A3B8',
  draftLight: '#1C2E25',
  draftBorder: '#283C31',

  offline: '#F59E0B',
  offlineLight: '#3D2D10',

  // Crop Visual Accent Colors
  cropMaize: '#F59E0B',
  cropBeans: '#F87171',
  cropRice: '#3FA379',
  cropSoybeans: '#4ADE80',
  cropPotatoes: '#FBBF24',
  cropCoffee: '#D97706',
  cropCassava: '#2DD4BF',
};

// Default exported colors (for backwards compatibility)
export const colors = lightColors;

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
