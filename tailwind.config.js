/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: '#F2F4F6',
          surface: '#FFFFFF',
          primary: '#3182F6',
          text: {
            main: '#191F28',
            sub: '#4E5968',
          }
        },
        boxShadow: {
          card: '0 4px 20px rgba(0, 0, 0, 0.05)',
          floating: '0 8px 30px rgba(0, 0, 0, 0.12)',
        }
      },
    },
    plugins: [],
  }