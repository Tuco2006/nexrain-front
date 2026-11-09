import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#04080f",
          900: "#0a111d",
          800: "#0f1a2b",
          700: "#17263d",
        },
        brand: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        accent: {
          400: "#818cf8",
          500: "#6366f1",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(14,165,233,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
