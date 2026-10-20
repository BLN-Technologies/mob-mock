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
  // Brand - Refined Instagram-Grade High Contrast Dark Mode
  primary: '#10B981',
  primaryDark: '#059669',
  primaryDeep: '#047857',
  primaryLight: '#132E22',
  primaryMuted: '#10B981',
  accent: '#34D399',
  accentDark: '#059669',
  accentLight: '#153A2A',
  brandForest: '#10B981',
  brandDeep: '#059669',
  brandGold: '#F59E0B',
  brandAmber: '#FBBF24',
  softMint: '#132E22',

  // Surfaces & Backgrounds - Sleek true dark (IG / Spotify aesthetic)
  background: '#090D0B',
  backgroundWarm: '#0E1411',
  surface: '#121A15',
  surfaceSubtle: '#1A2720',
  surfaceCard: '#15211B',
  surfaceHighlighted: '#1E3026',
  surfaceMint: '#132E22',
  white: '#FFFFFF',
  error: '#F87171',

  // Neutrals - Crisp, legible typography against dark canvas
  neutralDark: '#FFFFFF',
  neutralHeadings: '#FFFFFF',
  neutralBody: '#E2E8F0',
  neutralGray: '#94A3B8',
  neutralLight: '#64748B',
  neutralSubtle: '#33483D',
  border: '#223429',
  borderLight: '#19261F',
  borderFocus: '#10B981',
  divider: '#1C2B22',

  // Status & Semantic Colors
  success: '#10B981',
  successDark: '#059669',
  successLight: '#132E22',
  successBorder: '#10B981',

  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#3D2D10',
  warningBorder: '#D97706',

  danger: '#F87171',
  dangerDark: '#EF4444',
  dangerLight: '#3A1513',
  dangerBorder: '#EF4444',

  info: '#60A5FA',
  infoDark: '#3B82F6',
  infoLight: '#172B4D',
  infoBorder: '#3B82F6',

  draft: '#94A3B8',
  draftLight: '#1A2720',
  draftBorder: '#223429',

  offline: '#F59E0B',
  offlineLight: '#3D2D10',

  // Crop Visual Accent Colors
  cropMaize: '#F59E0B',
  cropBeans: '#F87171',
  cropRice: '#34D399',
  cropSoybeans: '#4ADE80',
  cropPotatoes: '#FBBF24',
  cropCoffee: '#D97706',
  cropCassava: '#2DD4BF',
};

// Default exported colors (mutable clone for live dynamic updates)
export const colors = { ...lightColors };

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
