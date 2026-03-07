/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Outfit', 'sans-serif'],
        rajdhani: ['Outfit', 'Inter', 'sans-serif'],
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Cabinet Grotesk', 'sans-serif'],
      },
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        gold: 'var(--gold)',
        teal: 'var(--teal)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 4px 16px oklch(0.04 0.02 260 / 0.8), 0 1px 0 oklch(0.35 0.08 260 / 0.3) inset',
        'gold-glow': '0 0 20px oklch(0.75 0.18 65 / 0.4), 0 0 60px oklch(0.75 0.18 65 / 0.2)',
        'teal-glow': '0 0 20px oklch(0.70 0.20 185 / 0.4), 0 0 60px oklch(0.70 0.20 185 / 0.2)',
        '3d-sm': '0 2px 8px oklch(0.04 0.02 260 / 0.6), 0 1px 2px oklch(0.04 0.02 260 / 0.4)',
        '3d-md': '0 4px 16px oklch(0.04 0.02 260 / 0.7), 0 2px 4px oklch(0.04 0.02 260 / 0.5), 0 0 0 1px oklch(0.25 0.05 260 / 0.3)',
        '3d-lg': '0 8px 32px oklch(0.04 0.02 260 / 0.8), 0 4px 8px oklch(0.04 0.02 260 / 0.6), 0 0 0 1px oklch(0.25 0.05 260 / 0.4)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatShape: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 10px oklch(0.75 0.18 65 / 0.3)' },
          '50%': { boxShadow: '0 0 30px oklch(0.75 0.18 65 / 0.6)' },
        },
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 10px oklch(0.72 0.18 188 / 0.3)' },
          '50%': { boxShadow: '0 0 25px oklch(0.72 0.18 188 / 0.6)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out both',
        fadeIn: 'fadeIn 0.4s ease-out both',
        slideDown: 'slideDown 0.4s ease-out both',
        floatShape: 'floatShape 20s ease-in-out infinite',
        pulseGold: 'pulseGold 2s ease-in-out infinite',
        neonPulse: 'neonPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
}
