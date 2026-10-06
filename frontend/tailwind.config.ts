import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#102033",
        ink: "#17191f",
        paper: "#f6f3ee",
        champagne: "#c6a56a",
        "champagne-deep": "#6e5128",
        mist: "#8d97a6",
        line: "#e6dfd3",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Cormorant Garamond", "Palatino Linotype", "Palatino", "serif"],
      },
      boxShadow: {
        card: "none",
      },
      maxWidth: {
        page: "96rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
