import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12203a',
        muted: '#61708b',
        cloud: '#f4f7fb',
        line: '#e5eaf2',
        brand: '#4563ff',
        mint: '#16b89a',
        coral: '#f06b5b',
        amber: '#e8a33a',
      },
      boxShadow: { soft: '0 18px 50px rgba(30, 52, 92, .09)' },
      borderRadius: { '2xl': '1.25rem' },
    },
  },
  plugins: [],
};
export default config;
