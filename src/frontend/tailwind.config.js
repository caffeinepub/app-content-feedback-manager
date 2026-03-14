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
        display: ['Cabinet Grotesk', 'Outfit', 'sans-serif'],
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
        // Neon palette tokens
        neon: {
          cyan: '#00cfff',
          blue: '#00a8e8',
          green: '#00e87a',
          purple: '#BF00FF',
        },
        cyber: {
          purple: '#BF00FF',
          purpleDim: 'rgba(191,0,255,0.4)',
        },
        navy: {
          bg: '#02040F',
          card: '#080D1E',
          elevated: '#0C1228',
          deep: '#050A30',
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
        'neon-cyan': '0 0 12px rgba(0, 255, 255, 0.3), 0 0 24px rgba(0, 255, 255, 0.1)',
        'neon-cyan-lg': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.2)',
        'neon-purple': '0 0 12px rgba(191, 0, 255, 0.3), 0 0 24px rgba(191, 0, 255, 0.1)',
        'neon-purple-lg': '0 0 20px rgba(191, 0, 255, 0.5), 0 0 40px rgba(191, 0, 255, 0.2)',
        'glass': '0 4px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 255, 255, 0.07)',
        'navy-card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        '3d-sm': '0 2px 8px rgba(0, 0, 30, 0.6)',
        '3d-md': '0 4px 16px rgba(0, 0, 30, 0.7)',
        '3d-lg': '0 8px 32px rgba(0, 0, 30, 0.8)',
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
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(0, 255, 255, 0.65)' },
        },
        neonGlow: {
          '0%, 100%': { borderColor: 'rgba(0, 255, 255, 0.4)' },
          '50%': { borderColor: 'rgba(0, 255, 255, 0.9)' },
        },
        hudFlicker: {
          '0%, 100%': { borderColor: 'rgba(0, 255, 255, 0.6)' },
          '30%': { borderColor: '#BF00FF' },
          '60%': { borderColor: '#00FFFF' },
        },
        musicGlowPulse: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(0, 255, 255, 0.5)' },
          '50%': { boxShadow: '0 0 32px rgba(0, 255, 255, 0.8)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out both',
        fadeIn: 'fadeIn 0.4s ease-out both',
        slideDown: 'slideDown 0.4s ease-out both',
        floatShape: 'floatShape 20s ease-in-out infinite',
        neonPulse: 'neonPulse 2.5s ease-in-out infinite',
        neonGlow: 'neonGlow 2s ease-in-out infinite',
        hudFlicker: 'hudFlicker 0.6s ease-in-out',
        musicGlowPulse: 'musicGlowPulse 2s ease-in-out infinite',
        revealUp: 'revealUp 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
}
