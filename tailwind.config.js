/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Medical Teal/Azure (Main Brand)
        primary: {
          DEFAULT: '#06b6d4',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Main Medical Teal
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Medical Blue Variant
        'medical-blue': {
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Secondary - Royal Purple/Indigo (Hierarchy)
        secondary: {
          DEFAULT: '#8b5cf6',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Royal Purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Accent - Emerald (Success/Highlights)
        accent: {
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          amber: {
            50: '#fffbeb',
            100: '#fef3c7',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
          },
        },
        // Neutral - Warm Off-Whites & Graphite
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Status Colors - Vivid but Elegant
        success: {
          DEFAULT: '#10b981',
          bg: '#d1fae5',
          text: '#065f46',
          border: '#6ee7b7',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fef3c7',
          text: '#92400e',
          border: '#fcd34d',
        },
        error: {
          DEFAULT: '#ef4444',
          bg: '#fee2e2',
          text: '#991b1b',
          border: '#fca5a5',
        },
        info: {
          DEFAULT: '#3b82f6',
          bg: '#dbeafe',
          text: '#1e40af',
          border: '#93c5fd',
        },
      },
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        gradientShift: 'gradientShift 10s ease infinite',
        float: 'float 3s ease-in-out infinite',
        fadeInUp: 'fadeInUp 900ms ease both',
        fadeInUpDelayed: 'fadeInUp 900ms ease 120ms both',
        fadeIn: 'fadeIn 1.2s ease 500ms both',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #fafaf9 100%)',
        'gradient-nav': 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        'gradient-table-header': 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        'gradient-surface': 'linear-gradient(135deg, #fafaf9 0%, #f8fafc 100%)',
        'gradient-landing': 'linear-gradient(120deg, #fafaf9, #f1f5f9)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'card-elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(6, 182, 212, 0.1)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}


