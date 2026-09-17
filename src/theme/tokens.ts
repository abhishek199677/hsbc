/**
 * Enterprise Premium Design Tokens
 * Refined dark theme with violet + gold accents for MNC-grade UI
 */

export const tokens = {
  colors: {
    background: '#06060a',
    foreground: '#f8f8fc',
    surface: '#13131a',
    surfaceHover: '#1e1e28',
    surfaceElevated: '#1a1a24',
    primary: '#a78bfa',
    primaryForeground: '#06060a',
    primaryHover: '#8b5cf6',
    secondary: '#f5c542',
    secondaryForeground: '#06060a',
    muted: '#1e1e28',
    mutedForeground: '#8b8ba0',
    border: '#1e1e28',
    input: '#1e1e28',
    ring: '#a78bfa',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  fontFamily: {
    sans: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
    display: '"Inter", "SF Pro Display", system-ui, sans-serif',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 16px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.4)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)',
    xl: '0 32px 80px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.5)',
    glow: '0 0 40px rgba(167, 139, 250, 0.12)',
    glowStrong: '0 0 60px rgba(167, 139, 250, 0.2)',
  },
} as const;

export type Tokens = typeof tokens;
