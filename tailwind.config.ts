import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        yarn: {
          50: "#F7F9F7",
          100: "#EFF3EF",
          200: "#E0E8E1",
          300: "#CCD8CE",
          400: "#A6B9A9",
          500: "#7F9684",
          600: "#5B7360",
          700: "#445949",
          800: "#2F4034",
          900: "#1E2B21",
          950: "#131D16",
        },
        sage: {
          50: "#F4F7F5",
          100: "#E6EFE8",
          200: "#D1E2D5",
          300: "#B2CEBA",
          400: "#8EB799",
          500: "#6E9C7B",
          600: "#558062",
          700: "#42664D",
          800: "#334F3C",
          900: "#24382B",
          950: "#14221A",
        },
        celadon: {
          50: "#F2F8F3",
          100: "#E2F1E4",
          200: "#C5E3CA",
          300: "#9ECFAA",
          400: "#72B582",
          500: "#509C63",
          600: "#3D804E",
          700: "#31653F",
          800: "#295033",
          900: "#22422B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "Cambria", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(30, 43, 33, 0.05), 0 4px 6px -2px rgba(30, 43, 33, 0.02)",
        lift: "0 10px 25px -5px rgba(85, 128, 98, 0.16), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
