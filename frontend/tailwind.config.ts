import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#102033",
        ink: "#17191f",
        paper: "#eef3f7",
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
        card: "0 22px 50px -34px rgba(16, 18, 24, 0.55)",
      },
      maxWidth: {
        page: "96rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
