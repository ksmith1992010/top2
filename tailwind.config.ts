import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        top: {
          navy: "#0f2744",
          slate: "#1e3a5f",
          accent: "#2563eb",
          muted: "#64748b",
          surface: "#f8fafc",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
