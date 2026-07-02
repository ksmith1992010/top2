import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        top: {
          navy: "#0B1426",
          slate: "#132337",
          gold: "#C9A227",
          "gold-hover": "#B8941F",
          muted: "#8B9CB3",
          surface: "#0F1A2E",
          "surface-raised": "#152238",
          card: "#152238",
          border: "#243047",
          "border-subtle": "#2F3F58",
          text: "#E8EDF4",
        },
      },
      backgroundImage: {
        "command-gradient":
          "linear-gradient(135deg, #0B1426 0%, #0F1A2E 45%, #060b14 100%)",
        "gold-glow":
          "radial-gradient(ellipse at top left, rgba(201, 162, 39, 0.14) 0%, transparent 55%)",
      },
      boxShadow: {
        command:
          "0 0 0 1px rgba(139, 156, 179, 0.08), 0 4px 24px rgba(0, 0, 0, 0.35)",
        "command-lg":
          "0 0 0 1px rgba(201, 162, 39, 0.12), 0 8px 32px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
