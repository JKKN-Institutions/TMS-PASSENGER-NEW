/**
 * JKKN TMS Theme Constants
 * Single source of truth for all colors, gradients, and styling
 */

export const THEME = {
  // Primary Colors
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981', // Main brand color
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    accent: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },

  // Gradients
  gradients: {
    background: 'bg-gray-50',
    backgroundDark: 'bg-gray-900',
    primary: 'bg-[#0b6d41]',
    secondary: 'bg-gray-100',
    accent: 'bg-[#0b6d41]',
    card: 'bg-white',
    hover: 'hover:bg-gray-50',
    text: 'text-gray-900',
  },

  // Borders
  borders: {
    default: 'border-gray-200/50',
    hover: 'hover:border-green-200/70',
    focus: 'focus:border-green-500',
    card: 'border-2 border-gray-100',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    default: 'shadow-lg',
    lg: 'shadow-xl',
    card: 'shadow-xl hover:shadow-2xl',
    glow: 'shadow-lg shadow-green-100/50',
    glowHover: 'hover:shadow-xl hover:shadow-green-100/50',
  },

  // Animations
  animations: {
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideInLeft',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },

  // Transitions
  transitions: {
    default: 'transition-all duration-300',
    fast: 'transition-all duration-200',
    slow: 'transition-all duration-500',
    colors: 'transition-colors duration-200',
  },

  // Buttons
  buttons: {
    primary: `
      bg-[#0b6d41]
      hover:bg-[#085032]
      text-white font-semibold
      px-6 py-3 rounded-xl
      shadow-lg hover:shadow-xl
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white border-2 border-gray-200
      hover:bg-gray-50 hover:border-gray-300
      text-gray-700 font-semibold
      px-6 py-3 rounded-xl
      shadow-md hover:shadow-lg
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent
      hover:bg-gray-50
      text-gray-700 font-medium
      px-4 py-2 rounded-lg
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  },

  // Cards
  cards: {
    default: `
      bg-white/80 backdrop-blur-sm
      rounded-xl border border-gray-200
      shadow-lg hover:shadow-xl
      hover:border-gray-300
      transition-all duration-300
    `,
    elevated: `
      bg-white
      rounded-2xl border-2 border-gray-100
      shadow-2xl
      transition-all duration-300
    `,
    gradient: `
      bg-white
      rounded-xl border border-gray-200
      shadow-lg hover:shadow-xl
      transition-all duration-300
    `,
  },

  // Typography
  typography: {
    h1: 'text-3xl sm:text-4xl font-bold',
    h2: 'text-2xl sm:text-3xl font-bold',
    h3: 'text-xl sm:text-2xl font-bold',
    h4: 'text-lg sm:text-xl font-semibold',
    body: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
    gradient: 'text-gray-900',
  },
} as const;

// Helper functions
export const getButtonClass = (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
  return THEME.buttons[variant].trim().replace(/\s+/g, ' ');
};

export const getCardClass = (variant: 'default' | 'elevated' | 'gradient' = 'default') => {
  return THEME.cards[variant].trim().replace(/\s+/g, ' ');
};

export const getGradientBackground = () => THEME.gradients.background;

export const getPrimaryGradient = () => THEME.gradients.primary;






























