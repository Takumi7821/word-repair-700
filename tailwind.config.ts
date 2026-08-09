import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151c",
        paper: "#f7f5f0",
        accent: "#1f6f5c",
        accentSoft: "#e4f2ee",
        repair: "#c9622a",
        repairSoft: "#fbe8db",
        weak: "#8a6d1f",
        weakSoft: "#f6ecd2",
      },
      fontFamily: {
        display: ["'Zen Kaku Gothic New'", "'Hiragino Sans'", "sans-serif"],
      },
      keyframes: {
        "repair-pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "repair-pop": "repair-pop 420ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
