import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        'bg-page':    'var(--bg-page)',
        'bg-surface': 'var(--bg-surface)',
        'bg-subtle':  'var(--bg-subtle)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        accent:           'var(--accent-primary)',
        'accent-hover':   'var(--accent-secondary)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'status-owned':     'var(--status-owned)',
        'status-purchased': 'var(--status-purchased)',
        'status-wanted':    'var(--status-wanted)',
        'status-partsbin':  'var(--status-partsbin)',
      },
    },
  },
  plugins: [],
} satisfies Config
