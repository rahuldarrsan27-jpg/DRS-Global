import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#05060a',
        paper: '#eef0f3',
      },
      letterSpacing: {
        tightest: '-0.055em',
        tighter: '-0.038em',
        wide: '0.08em',
        wider: '0.18em',
        widest: '0.32em',
      },
    },
  },
  plugins: [],
};

export default config;
