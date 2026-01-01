/** @type {const} */
const themeColors = {
  // Primary brand colors - vibrant green gradient base
  primary: { light: '#10B981', dark: '#10B981' },
  primaryDark: { light: '#059669', dark: '#059669' },
  primaryLight: { light: '#34D399', dark: '#34D399' },
  
  // Background colors - deep dark for premium feel
  background: { light: '#ffffff', dark: '#0A0F0D' },
  backgroundSecondary: { light: '#F9FAFB', dark: '#111916' },
  
  // Surface colors - elevated cards
  surface: { light: '#F3F4F6', dark: '#151F1B' },
  surfaceElevated: { light: '#FFFFFF', dark: '#1A2621' },
  
  // Text colors
  foreground: { light: '#111827', dark: '#F9FAFB' },
  muted: { light: '#6B7280', dark: '#9CA3AF' },
  
  // Border colors
  border: { light: '#E5E7EB', dark: '#1F2E28' },
  borderLight: { light: '#F3F4F6', dark: '#253530' },
  
  // Status colors
  success: { light: '#22C55E', dark: '#4ADE80' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
  info: { light: '#3B82F6', dark: '#60A5FA' },
  
  // Accent colors for gamification
  gold: { light: '#F59E0B', dark: '#FBBF24' },
  silver: { light: '#9CA3AF', dark: '#D1D5DB' },
  bronze: { light: '#D97706', dark: '#F59E0B' },
  purple: { light: '#8B5CF6', dark: '#A78BFA' },
  
  // Community colors
  community: { light: '#6366F1', dark: '#818CF8' },
  marketplace: { light: '#EC4899', dark: '#F472B6' },
  
  // Gradient stops (for reference in code)
  gradientStart: { light: '#10B981', dark: '#10B981' },
  gradientEnd: { light: '#059669', dark: '#34D399' },
};

module.exports = { themeColors };
