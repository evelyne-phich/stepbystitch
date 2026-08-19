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
          50: "#FAF7F2",
          100: "#F5EFEB",
          200: "#EADDCF",
          300: "#DBC2AA",
          400: "#C9A17F",
          500: "#B8835A",
          600: "#9E6842",
          700: "#7F4E31",
          800: "#633B26",
          900: "#4D2D1E",
        },
        terracotta: {
          50: "#FFF5F2",
          100: "#FFE8E2",
          200: "#FED1C5",
          300: "#FCAFA0",
          400: "#F87F69",
          500: "#E75338",
          600: "#CC3B21",
          700: "#A82B15",
          800: "#862414",
          900: "#6B2014",
        },
        sage: {
          50: "#F4F7F4",
          100: "#E5ECE5",
          200: "#CCD9CD",
          300: "#ABC1AD",
          400: "#84A487",
          500: "#658768",
          600: "#4F6C52",
          700: "#405642",
          800: "#354637",
          900: "#2C3A2E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
        lift: "0 10px 25px -5px rgba(184, 131, 90, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
