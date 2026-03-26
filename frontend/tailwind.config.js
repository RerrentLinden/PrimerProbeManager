/** @type {import('tailwindcss').Config} */

/* Helper: reference a CSS RGB variable with alpha support */
const v = (name) => `rgb(var(--lab-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        lab: {
          bg: v('bg'),
          surface: v('surface'),
          raised: v('raised'),
          highlight: v('highlight'),
          metal: v('metal'),
          'metal-light': v('metal-light'),
          'metal-edge': v('metal-edge'),
          border: v('border'),
          'border-light': v('border-light'),
          text: v('text'),
          muted: v('muted'),
          faint: v('faint'),
          accent: v('accent'),
          probe: v('probe'),
          success: v('success'),
          danger: v('danger'),
          warning: v('warning'),
        },
      },
      boxShadow: {
        'panel': '0 2px 8px rgba(0,0,0,var(--shadow-strength,0.35)), 0 1px 3px rgba(0,0,0,var(--shadow-strength,0.25))',
        'panel-lg': '0 4px 16px rgba(0,0,0,var(--shadow-strength,0.4)), 0 2px 6px rgba(0,0,0,var(--shadow-strength,0.3))',
        'panel-hover': '0 4px 12px rgba(0,0,0,var(--shadow-strength,0.4)), 0 2px 4px rgba(0,0,0,var(--shadow-strength,0.3))',
        'recess': 'inset 0 2px 4px rgba(0,0,0,var(--shadow-strength,0.4)), inset 0 0 0 1px rgba(0,0,0,0.15)',
        'raised': '0 2px 4px rgba(0,0,0,var(--shadow-strength,0.3)), 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
        'raised-hover': '0 3px 6px rgba(0,0,0,var(--shadow-strength,0.35)), 0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
        'pressed': 'inset 0 2px 4px rgba(0,0,0,var(--shadow-strength,0.35)), inset 0 1px 1px rgba(0,0,0,0.2)',
        'glow-blue': '0 0 8px rgba(var(--lab-accent),0.4), 0 0 2px rgba(var(--lab-accent),0.6)',
        'glow-orange': '0 0 8px rgba(var(--lab-probe),0.4), 0 0 2px rgba(var(--lab-probe),0.6)',
        'glow-green': '0 0 8px rgba(var(--lab-success),0.4), 0 0 2px rgba(var(--lab-success),0.6)',
        'glow-red': '0 0 8px rgba(var(--lab-danger),0.4), 0 0 2px rgba(var(--lab-danger),0.6)',
        'modal': '0 8px 32px rgba(0,0,0,var(--shadow-strength,0.5)), 0 4px 12px rgba(0,0,0,var(--shadow-strength,0.35)), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'metal-sidebar': 'linear-gradient(180deg, rgb(var(--sidebar-top)) 0%, rgb(var(--sidebar-bottom)) 100%)',
        'brushed': 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'led-blink': 'led-blink 1.5s ease-in-out infinite',
        'press': 'btn-press 100ms ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(var(--lab-danger), 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(var(--lab-danger), 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(var(--lab-danger), 0)' },
        },
        'led-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'btn-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
