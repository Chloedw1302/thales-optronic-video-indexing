/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007185', // Amazon blue - professional and trustworthy
          hover: '#008397',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F0F2F2', // Light gray for backgrounds
          foreground: '#111111',
        },
        background: {
          DEFAULT: '#FFFFFF', // Clean white background
          subtle: '#F7F7F7', // Very light gray for subtle backgrounds
          card: '#FFFFFF', // White cards
        },
        foreground: {
          DEFAULT: '#111111', // Dark gray text
          muted: '#555555', // Medium gray for secondary text
        },
        muted: {
          DEFAULT: '#E7E9EC', // Light gray for muted elements
          foreground: '#555555',
        },
        accent: {
          DEFAULT: '#E7E9EC', // Light gray for accents
          hover: '#DADBDB',
          foreground: '#111111',
          orange: '#FF9900', // Amazon orange for highlights
          yellow: '#FFD814', // Amazon yellow for warnings
          blue: '#007185', // Amazon blue
          green: '#00A651', // Amazon green for success
          red: '#C45500', // Amazon red for errors
        },
        destructive: {
          DEFAULT: '#D12F19', // More visible red for destructive actions
          hover: '#B82612',
        },
        border: {
          DEFAULT: '#DDDDDD', // Light gray borders
          subtle: '#E7E9EC',
        },
        input: '#FFFFFF',
        ring: '#007185',
      },
      fontFamily: {
        sans: ['Amazon Ember', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.16' }],
      },
      borderRadius: {
        lg: '0.25rem', // More squared corners - Amazon style
        md: '0.25rem',
        sm: '0.125rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 2px 6px 0 rgba(0, 0, 0, 0.1)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
