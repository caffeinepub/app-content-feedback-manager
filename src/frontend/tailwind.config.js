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
        heading: ['Syne', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        subheading: ['DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
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
        gold: {
          DEFAULT: '#F5C842',
          dim: 'rgba(245,200,66,0.15)',
          glow: 'rgba(245,200,66,0.25)',
        },
        royalBlue: '#2D6FF7',
        neon: {
          cyan: '#00cfff',
          blue: '#00a8e8',
          green: '#00e87a',
          purple: '#BF00FF',
        },
        navy: {
          bg: '#080C1A',
          card: '#0D1225',
          elevated: '#111830',
          deep: '#050810',
        },
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
        'neon-gold': '0 0 12px rgba(245,200,66,0.4), 0 0 24px rgba(245,200,66,0.15)',
        'neon-gold-lg': '0 0 24px rgba(245,200,66,0.6), 0 0 48px rgba(245,200,66,0.25)',
        'neon-cyan': '0 0 12px rgba(0, 255, 255, 0.3), 0 0 24px rgba(0, 255, 255, 0.1)',
        'glass': '0 4px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(245,200,66,0.07)',
        'navy-card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        '3d-lg': '0 8px 32px rgba(0, 0, 20, 0.8)',
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
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(245,200,66,0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(245,200,66,0.65)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        goldPulse: {
          '0%,100%': { boxShadow: '0 0 10px rgba(245,200,66,0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(245,200,66,0.7)' },
        },
        musicGlowPulse: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(245,200,66,0.5)' },
          '50%': { boxShadow: '0 0 32px rgba(245,200,66,0.8)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        holographicShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        livePulse: {
          '0%,100%': { boxShadow: '0 0 8px rgba(255,51,51,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255,51,51,0.7)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out both',
        fadeIn: 'fadeIn 0.4s ease-out both',
        slideDown: 'slideDown 0.4s ease-out both',
        neonPulse: 'neonPulse 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        goldPulse: 'goldPulse 2.5s ease-in-out infinite',
        musicGlowPulse: 'musicGlowPulse 2s ease-in-out infinite',
        revealUp: 'revealUp 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both',
        holographicShift: 'holographicShift 4s ease infinite',
        livePulse: 'livePulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
}
