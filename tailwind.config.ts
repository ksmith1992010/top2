import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        top: {
          /* Dark, clean, red only when action is needed. */
          black: "#000000",
          surface: "#0b0c0d",
          card: "#141618",
          "surface-raised": "#1b1e21",
          border: "#23262a",
          "border-subtle": "#2f3338",
          muted: "#81888e",
          text: "#ffffff",
          /* Reserved for action: CTAs, alerts, stuck jobs. Never ambient. */
          accent: "#ff3235",
          "accent-hover": "#e02b2e",
          "accent-muted": "#dd6f6d",
          "accent-soft": "#fb8a86",
          /* Text on any red fill. White fails AA on all three reds (3.65:1
             on #ff3235); black clears it at 5.76:1. */
          "on-accent": "#000000",
        },
      },
      backgroundImage: {
        "command-gradient":
          "linear-gradient(135deg, #0b0c0d 0%, #141618 45%, #000000 100%)",
        "accent-glow":
          "radial-gradient(ellipse at top left, rgba(255, 50, 53, 0.10) 0%, transparent 55%)",
      },
      boxShadow: {
        command:
          "0 0 0 1px rgba(129, 136, 142, 0.08), 0 4px 24px rgba(0, 0, 0, 0.55)",
        "command-lg":
          "0 0 0 1px rgba(129, 136, 142, 0.12), 0 8px 32px rgba(0, 0, 0, 0.65)",
      },
    },
  },
  plugins: [],
};

export default config;
