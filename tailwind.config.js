/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        maroon: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cdd5',
          300: '#f0a3b2',
          400: '#e36e87',
          500: '#d04364',
          600: '#b72b4d',
          700: '#7A1A2C', // Primary Deep Maroon
          800: '#631524',
          900: '#4A101E', // Darker Maroon
          950: '#2d0811',
        },
        indigo: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cdd5',
          300: '#f0a3b2',
          400: '#e36e87',
          500: '#7A1A2C',
          600: '#7A1A2C', // Internal Button Primary
          700: '#631524', // Internal Button Hover
          800: '#4A101E',
          900: '#2d0811',
          950: '#1c060d',
        },
        blue: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cdd5',
          300: '#f0a3b2',
          400: '#e36e87',
          500: '#7A1A2C',
          600: '#7A1A2C',
          700: '#631524',
          800: '#4A101E',
          900: '#2d0811',
          950: '#1c060d',
        },
        gold: {
          50: '#fefdf5',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#F6C84C', // Light Gold
          400: '#e0a922',
          500: '#C08A16', // Accent Gold
          600: '#9d6d0d',
          700: '#7a5209',
          800: '#5c3d07',
          900: '#3e2804',
        },
        warm: {
          bg: '#FBF7F2',     // Page background
          card: '#FFFFFF',   // Cards
          border: '#EADFD3', // Soft border
          borderLight: '#F3ECE4',
          text: '#2B1B1B',   // Dark brown-black text
          muted: '#7A6A63',  // Secondary text
          light: '#F5EFE8',
          accent: '#F3ECE4',
        },
        status: {
          pass: '#2E7D32',
          sent: '#2E7D32',
          pending: '#D97706',
          error: '#C62828',
          fail: '#C62828',
        },
        brand: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cdd5',
          300: '#f0a3b2',
          400: '#F6C84C',
          500: '#C08A16',
          600: '#7A1A2C',
          700: '#631524',
          800: '#4A101E',
          900: '#2d0811',
          950: '#1c060d',
        }
      },
      boxShadow: {
        'warm': '0 2px 8px -2px rgba(43, 27, 27, 0.05), 0 1px 4px -1px rgba(43, 27, 27, 0.03)',
        'warm-hover': '0 10px 25px -5px rgba(122, 26, 44, 0.08), 0 8px 10px -6px rgba(43, 27, 27, 0.04)',
        'maroon-glow': '0 0 25px -5px rgba(122, 26, 44, 0.35)',
        'gold-glow': '0 0 25px -5px rgba(192, 138, 22, 0.35)',
      }
    },
  },
  plugins: [],
}

