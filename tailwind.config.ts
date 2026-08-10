import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep blue-black ink, cooler than a plain slate.
        ink: "#0c1424",
        // Cool paper with a faint blue tint, not stark white.
        paper: "#f5f7fc",
        // Cobalt — the brand blue. CTAs, active states, progress, links.
        primary: "#1552d1",
        primarySoft: "#e7edfd",
        primaryDark: "#0f3ea8",
        // Emerald — correct / KNOWN feedback.
        success: "#0f9d6c",
        successSoft: "#e3f7ee",
        // Amber — WEAK FOUND feedback (a place to grow, not a failure).
        weak: "#c17d11",
        weakSoft: "#fbf1de",
        // Indigo-violet — LEVEL UP feedback, distinct from primary blue.
        levelup: "#6d3fd1",
        levelupSoft: "#efe7fc",
      },
      fontFamily: {
        // Sora carries numerals, badges (LEVEL UP / KNOWN / 700 READY) and the
        // wordmark. Japanese body copy stays on the system UI stack for legibility.
        display: ["var(--font-sora)", "'Hiragino Sans'", "sans-serif"],
        body: ["'Hiragino Sans'", "'Yu Gothic Medium'", "sans-serif"],
      },
      keyframes: {
        "levelup-pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        "levelup-pop": "levelup-pop 420ms cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
