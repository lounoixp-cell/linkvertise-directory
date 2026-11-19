import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          200: '#f8d5d6',
          300: '#f2b5b7',
          400: '#e8898d',
          500: '#dc5b62',
          600: '#c83f47',
          700: '#a73038',
          800: '#8c2c32',
          900: '#75292e',
        },
        surface: {
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          800: '#09090b',
          900: '#040405',
        }
      },
    },
  },
  plugins: [],
};
export default config;
