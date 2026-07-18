/**
 * MonadBuilder+ design tokens — synced from sibling web artifact (index.css).
 *
 * Web palette (all dark mode, no light theme):
 *   --background: hsl(250 24% 4%)   → #0A0A0F
 *   --foreground: hsl(0 0% 98%)     → #FAFAFA
 *   --primary:    hsl(249 91% 70%)  → #836EF9
 *   --card:       hsl(250 24% 7%)   → #0F0F18
 *   --border:     hsl(250 24% 15%)  → #1E1E30
 *   --muted-fg:   hsl(250 14% 65%) → #9B9AB2
 */

const colors = {
  light: {
    // Kept for type compat — app runs dark-only
    text: '#FAFAFA',
    tint: '#836EF9',
    background: '#0A0A0F',
    foreground: '#FAFAFA',
    card: '#0F0F18',
    cardForeground: '#FAFAFA',
    primary: '#836EF9',
    primaryForeground: '#FFFFFF',
    secondary: '#1E1E30',
    secondaryForeground: '#FAFAFA',
    muted: '#15151F',
    mutedForeground: '#9B9AB2',
    accent: '#836EF9',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#1E1E30',
    input: '#1E1E30',
  },

  dark: {
    text: '#FAFAFA',
    tint: '#836EF9',
    background: '#0A0A0F',
    foreground: '#FAFAFA',
    card: '#0F0F18',
    cardForeground: '#FAFAFA',
    primary: '#836EF9',
    primaryForeground: '#FFFFFF',
    secondary: '#1E1E30',
    secondaryForeground: '#FAFAFA',
    muted: '#15151F',
    mutedForeground: '#9B9AB2',
    accent: '#836EF9',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#1E1E30',
    input: '#1E1E30',
  },

  // Border radius matching --radius (0.5rem = 8px) from web artifact
  radius: 8,
};

export default colors;
