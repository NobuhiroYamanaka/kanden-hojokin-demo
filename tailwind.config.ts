import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Yu Gothic UI",
          "Meiryo",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          900: "#111827",
          700: "#374151",
          500: "#6b7280",
          300: "#d1d5db",
          100: "#f3f4f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
