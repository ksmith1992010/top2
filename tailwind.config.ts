import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        top: {
          navy: "#0a1628",
          slate: "#132337",
          accent: "#dc2626",
          "accent-hover": "#b91c1c",
          muted: "#94a3b8",
          surface: "#060b14",
          "surface-raised": "#0f1729",
          "surface-card": "#111827",
          border: "#1e293b",
          "border-subtle": "#334155",
        },
      },
      backgroundImage: {
        "command-gradient":
          "linear-gradient(135deg, #0a1628 0%, #060b14 50%, #0f1729 100%)",
        "accent-glow":
          "radial-gradient(ellipse at top left, rgba(220, 38, 38, 0.15) 0%, transparent 50%)",
      },
      boxShadow: {
        command: "0 0 0 1px rgba(148, 163, 184, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4)",
        "command-lg":
          "0 0 0 1px rgba(148, 163, 184, 0.1), 0 8px 32px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
