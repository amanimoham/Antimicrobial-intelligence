import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f2f2",
        primary: {
          DEFAULT: "#c41e3a",
          dark: "#9e1830",
          muted: "#f5d6dc",
        },
        border: {
          soft: "#e8d9dc",
        },
      },
      boxShadow: {
        card: "0 12px 40px rgba(196, 30, 58, 0.08)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
