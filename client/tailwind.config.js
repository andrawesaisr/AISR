/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Jira Blue Colors
        jira: {
          50: '#E9F2FF',
          100: '#CCE0FF',
          200: '#85B8FF',
          300: '#579DFF',
          400: '#388BFF',
          500: '#0C66E4', // Primary Jira Blue
          600: '#0055CC',
          700: '#09326C',
          800: '#092957',
          900: '#1C2B41',
        },
        // Jira Neutral Colors
        neutral: {
          0: '#FFFFFF',
          100: '#F7F8F9',
          200: '#F1F2F4',
          300: '#DCDFE4',
          400: '#B3B9C4',
          500: '#8590A2',
          600: '#758195',
          700: '#626F86',
          800: '#44546F',
          900: '#172B4D',
          1000: '#091E42',
        },
        // Jira Status Colors
        status: {
          blue: '#0C66E4',
          purple: '#6E5DC6',
          green: '#1F845A',
          yellow: '#946F00',
          red: '#AE2E24',
          gray: '#626F86',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        '11': '11px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '29': '29px',
      },
      boxShadow: {
        'jira': '0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
        'jira-hover': '0 4px 8px -2px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
        'jira-card': '0 1px 2px rgba(9, 30, 66, 0.25)',
      },
      borderRadius: {
        'jira': '3px',
      },
    },
  },
  plugins: [],
}
