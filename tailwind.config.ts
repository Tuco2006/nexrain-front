import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // texto principal (verde-petróleo bem escuro)
        ink: "#0b3a40",
        // fundo verde-água
        agua: {
          50: "#f2fbf9",
          100: "#e3f6f2",
          200: "#c7ece5",
          300: "#9edcd1",
        },
        brand: {
          50: "#e8f7f4",
          100: "#cdeee8",
          300: "#5fcfbf",
          400: "#2bb5a3",
          500: "#0f9488",
          600: "#0b7a70",
          700: "#0a5f58",
          800: "#0b4a45",
          900: "#0a3a37",
        },
        accent: {
          400: "#1f8fb3",
          500: "#136f93",
        },
        // faixa institucional (amarelo de alerta)
        alerta: "#f4c430",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        titulo: ["var(--font-titulo)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        cartao: "0 1px 2px rgba(11,58,64,0.06), 0 8px 24px -12px rgba(11,58,64,0.18)",
        glow: "0 10px 30px -10px rgba(15,148,136,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
